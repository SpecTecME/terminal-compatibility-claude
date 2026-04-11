using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/cargo-types")]
public class CargoTypeRefsController : ControllerBase
{
    private readonly TscDbContext _db;

    public CargoTypeRefsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.CargoTypeRefs.AsNoTracking().ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CargoTypeRefBody body)
    {
        var entity = new CargoTypeRef
        {
            PublicId            = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId            = body.TenantId ?? "default",
            Code                = body.Code,
            Name                = body.Name,
            CargoCategory       = body.CargoCategory,
            DefaultUnit         = body.DefaultUnit,
            ProductTypeId       = body.ProductTypeId,
            ProductTypePublicId = string.IsNullOrWhiteSpace(body.ProductTypePublicId) ? null : body.ProductTypePublicId,
            IsActive            = body.IsActive,
            SortOrder           = body.SortOrder,
            Notes               = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim(),
        };
        _db.CargoTypeRefs.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CargoTypeRefBody body)
    {
        var entity = await _db.CargoTypeRefs.FirstOrDefaultAsync(c => c.Id == id);
        if (entity is null) return NotFound();

        entity.Code                = body.Code ?? entity.Code;
        entity.Name                = body.Name ?? entity.Name;
        entity.CargoCategory       = body.CargoCategory ?? entity.CargoCategory;
        entity.DefaultUnit         = body.DefaultUnit ?? entity.DefaultUnit;
        entity.ProductTypeId       = body.ProductTypeId;
        entity.ProductTypePublicId = string.IsNullOrWhiteSpace(body.ProductTypePublicId) ? null : body.ProductTypePublicId;
        entity.IsActive            = body.IsActive;
        entity.SortOrder           = body.SortOrder;
        entity.Notes               = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim();

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.CargoTypeRefs.FirstOrDefaultAsync(c => c.Id == id);
        if (entity is null) return NotFound();
        _db.CargoTypeRefs.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record CargoTypeRefBody(
    string? Code,
    string? Name,
    string? CargoCategory,
    string? DefaultUnit,
    int?    ProductTypeId,
    string? ProductTypePublicId,
    bool    IsActive,
    int?    SortOrder,
    string? Notes,
    string? PublicId = null,
    string? TenantId = null
);
