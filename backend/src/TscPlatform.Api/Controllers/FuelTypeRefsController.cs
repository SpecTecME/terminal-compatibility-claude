using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/fuel-types")]
public class FuelTypeRefsController : ControllerBase
{
    private readonly TscDbContext _db;

    public FuelTypeRefsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.FuelTypeRefs.AsNoTracking().ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FuelTypeRefBody body)
    {
        var entity = new FuelTypeRef
        {
            PublicId        = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId        = body.TenantId ?? "default",
            Code            = body.Code,
            Name            = body.Name,
            Category        = string.IsNullOrWhiteSpace(body.Category) ? null : body.Category,
            HeatingRequired = body.HeatingRequired,
            IsCryogenic     = body.IsCryogenic,
            IsActive        = body.IsActive,
            SortOrder       = body.SortOrder,
        };
        _db.FuelTypeRefs.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] FuelTypeRefBody body)
    {
        var entity = await _db.FuelTypeRefs.FirstOrDefaultAsync(f => f.Id == id);
        if (entity is null) return NotFound();

        entity.Code            = body.Code ?? entity.Code;
        entity.Name            = body.Name ?? entity.Name;
        entity.Category        = string.IsNullOrWhiteSpace(body.Category) ? null : body.Category;
        entity.HeatingRequired = body.HeatingRequired;
        entity.IsCryogenic     = body.IsCryogenic;
        entity.IsActive        = body.IsActive;
        entity.SortOrder       = body.SortOrder;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.FuelTypeRefs.FirstOrDefaultAsync(f => f.Id == id);
        if (entity is null) return NotFound();
        _db.FuelTypeRefs.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record FuelTypeRefBody(
    string? Code,
    string? Name,
    string? Category,
    bool    HeatingRequired,
    bool    IsCryogenic,
    bool    IsActive,
    int?    SortOrder,
    string? PublicId = null,
    string? TenantId = null
);
