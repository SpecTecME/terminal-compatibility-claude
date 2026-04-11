using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase3;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/terminal-document-requirements")]
public class TerminalDocumentRequirementsController : ControllerBase
{
    private readonly TscDbContext _db;

    public TerminalDocumentRequirementsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? terminalPublicId, [FromQuery] string? berthPublicId)
    {
        var query = _db.TerminalDocumentRequirements.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(terminalPublicId))
            query = query.Where(r => r.TerminalPublicId == terminalPublicId);

        if (!string.IsNullOrWhiteSpace(berthPublicId))
            query = query.Where(r => r.BerthPublicId == berthPublicId);

        var items = await query.ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TerminalDocumentRequirementBody body)
    {
        var entity = new TerminalDocumentRequirement
        {
            PublicId             = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId             = body.TenantId ?? "default",
            TerminalPublicId     = body.TerminalPublicId ?? string.Empty,
            TerminalId           = body.TerminalId,
            BerthPublicId        = string.IsNullOrWhiteSpace(body.BerthPublicId) ? null : body.BerthPublicId,
            BerthId              = string.IsNullOrWhiteSpace(body.BerthId) ? null : body.BerthId,
            DocumentTypePublicId = body.DocumentTypePublicId ?? string.Empty,
            DocumentTypeId       = body.DocumentTypeId,
            AppliesLevel         = body.AppliesLevel,
            SubmissionStage      = body.SubmissionStage,
            IsRequired           = body.IsRequired,
            EffectiveFrom        = body.EffectiveFrom,
            ValidTo              = body.ValidTo,
            IsActive             = body.IsActive,
            IsMandatory          = body.IsMandatory,
            Priority             = body.Priority,
            Notes                = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim(),
            VesselConditionJson  = body.VesselConditionJson,
        };
        _db.TerminalDocumentRequirements.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TerminalDocumentRequirementBody body)
    {
        var entity = await _db.TerminalDocumentRequirements.FirstOrDefaultAsync(r => r.Id == id);
        if (entity is null) return NotFound();

        entity.TerminalPublicId     = body.TerminalPublicId ?? entity.TerminalPublicId;
        entity.TerminalId           = body.TerminalId ?? entity.TerminalId;
        entity.BerthPublicId        = string.IsNullOrWhiteSpace(body.BerthPublicId) ? null : body.BerthPublicId;
        entity.BerthId              = string.IsNullOrWhiteSpace(body.BerthId) ? null : body.BerthId;
        entity.DocumentTypePublicId = body.DocumentTypePublicId ?? entity.DocumentTypePublicId;
        entity.DocumentTypeId       = body.DocumentTypeId ?? entity.DocumentTypeId;
        entity.AppliesLevel         = body.AppliesLevel ?? entity.AppliesLevel;
        entity.SubmissionStage      = body.SubmissionStage ?? entity.SubmissionStage;
        entity.IsRequired           = body.IsRequired;
        entity.EffectiveFrom        = body.EffectiveFrom ?? entity.EffectiveFrom;
        entity.ValidTo              = body.ValidTo;
        entity.IsActive             = body.IsActive;
        entity.IsMandatory          = body.IsMandatory;
        entity.Priority             = body.Priority;
        entity.Notes                = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim();
        entity.VesselConditionJson  = body.VesselConditionJson ?? entity.VesselConditionJson;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.TerminalDocumentRequirements.FirstOrDefaultAsync(r => r.Id == id);
        if (entity is null) return NotFound();
        _db.TerminalDocumentRequirements.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record TerminalDocumentRequirementBody(
    string?   TerminalPublicId,
    string?   DocumentTypePublicId,
    string?   TerminalId,
    string?   BerthPublicId,
    string?   BerthId,
    string?   DocumentTypeId,
    string?   AppliesLevel,
    string?   SubmissionStage,
    bool      IsRequired,
    DateOnly? EffectiveFrom,
    DateOnly? ValidTo,
    bool      IsActive,
    bool      IsMandatory,
    int?      Priority,
    string?   Notes,
    string?   VesselConditionJson = null,
    string?   PublicId = null,
    string?   TenantId = null
);
