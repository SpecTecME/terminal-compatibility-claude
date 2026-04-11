using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/system-tags")]
public class SystemTagsController : ControllerBase
{
    private readonly TscDbContext _db;

    public SystemTagsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tags = await _db.SystemTags.AsNoTracking().ToListAsync();
        return Ok(tags);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SystemTagBody body)
    {
        var entity = new SystemTag
        {
            PublicId  = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId  = body.TenantId ?? "default",
            Name      = body.Name,
            Code      = body.Code,
            Category  = string.IsNullOrWhiteSpace(body.Category) ? null : body.Category,
            AppliesTo = body.AppliesTo ?? Array.Empty<string>(),
            IsSystem  = body.IsSystem,
            IsLocked  = body.IsLocked,
            IsActive  = body.IsActive,
            SortOrder = body.SortOrder,
        };
        _db.SystemTags.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SystemTagBody body)
    {
        var entity = await _db.SystemTags.FirstOrDefaultAsync(t => t.Id == id);
        if (entity is null) return NotFound();

        entity.Name      = body.Name ?? entity.Name;
        entity.Code      = body.Code ?? entity.Code;
        entity.Category  = string.IsNullOrWhiteSpace(body.Category) ? null : body.Category;
        entity.AppliesTo = body.AppliesTo ?? entity.AppliesTo;
        entity.IsSystem  = body.IsSystem;
        entity.IsLocked  = body.IsLocked;
        entity.IsActive  = body.IsActive;
        entity.SortOrder = body.SortOrder;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.SystemTags.FirstOrDefaultAsync(t => t.Id == id);
        if (entity is null) return NotFound();
        _db.SystemTags.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record SystemTagBody(
    string?   Name,
    string?   Code,
    string?   Category,
    string[]? AppliesTo,
    bool      IsSystem,
    bool      IsLocked,
    bool      IsActive,
    int?      SortOrder,
    string?   PublicId = null,
    string?   TenantId = null
);
