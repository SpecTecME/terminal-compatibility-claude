using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase2;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/system-tag-assignments")]
public class SystemTagAssignmentsController : ControllerBase
{
    private readonly TscDbContext _db;

    public SystemTagAssignmentsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? contactId)
    {
        var query = _db.SystemTagAssignments.AsNoTracking();
        if (contactId.HasValue)
            query = query.Where(a => a.ContactId == contactId.Value);
        return Ok(await query.ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SystemTagAssignmentBody body)
    {
        var entity = BuildEntity(body);
        _db.SystemTagAssignments.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreate([FromBody] List<SystemTagAssignmentBody> items)
    {
        var entities = items.Select(BuildEntity).ToList();
        _db.SystemTagAssignments.AddRange(entities);
        await _db.SaveChangesAsync();
        return Ok(entities);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.SystemTagAssignments.FirstOrDefaultAsync(a => a.Id == id);
        if (entity is null) return NotFound();
        _db.SystemTagAssignments.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static SystemTagAssignment BuildEntity(SystemTagAssignmentBody body) =>
        new()
        {
            PublicId          = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId          = body.TenantId ?? "default",
            ContactId         = body.ContactId,
            ContactPublicId   = string.IsNullOrWhiteSpace(body.ContactPublicId) ? null : body.ContactPublicId,
            SystemTagId       = body.SystemTagId,
            SystemTagPublicId = string.IsNullOrWhiteSpace(body.SystemTagPublicId) ? null : body.SystemTagPublicId,
        };
}

public record SystemTagAssignmentBody(
    int     ContactId,
    string? ContactPublicId,
    int     SystemTagId,
    string? SystemTagPublicId,
    string? PublicId  = null,
    string? TenantId  = null
);
