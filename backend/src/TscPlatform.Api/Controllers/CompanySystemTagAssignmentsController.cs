using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase2;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/company-system-tag-assignments")]
public class CompanySystemTagAssignmentsController : ControllerBase
{
    private readonly TscDbContext _db;

    public CompanySystemTagAssignmentsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? companyId)
    {
        var query = _db.CompanySystemTagAssignments.AsNoTracking();
        if (companyId.HasValue)
            query = query.Where(a => a.CompanyId == companyId.Value);
        return Ok(await query.ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CompanySystemTagAssignmentBody body)
    {
        var entity = BuildEntity(body);
        _db.CompanySystemTagAssignments.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreate([FromBody] List<CompanySystemTagAssignmentBody> items)
    {
        var entities = items.Select(BuildEntity).ToList();
        _db.CompanySystemTagAssignments.AddRange(entities);
        await _db.SaveChangesAsync();
        return Ok(entities);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.CompanySystemTagAssignments.FirstOrDefaultAsync(a => a.Id == id);
        if (entity is null) return NotFound();
        _db.CompanySystemTagAssignments.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static CompanySystemTagAssignment BuildEntity(CompanySystemTagAssignmentBody body) =>
        new()
        {
            PublicId         = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId         = body.TenantId ?? "default",
            CompanyId        = body.CompanyId,
            CompanyPublicId  = string.IsNullOrWhiteSpace(body.CompanyPublicId) ? null : body.CompanyPublicId,
            SystemTagId      = body.SystemTagId,
            SystemTagPublicId = string.IsNullOrWhiteSpace(body.SystemTagPublicId) ? null : body.SystemTagPublicId,
        };
}

public record CompanySystemTagAssignmentBody(
    int     CompanyId,
    string? CompanyPublicId,
    int     SystemTagId,
    string? SystemTagPublicId,
    string? PublicId  = null,
    string? TenantId  = null
);
