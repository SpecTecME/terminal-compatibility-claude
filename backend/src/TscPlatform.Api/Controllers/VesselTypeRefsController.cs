using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/vessel-types")]
public class VesselTypeRefsController : ControllerBase
{
    private readonly TscDbContext _db;

    public VesselTypeRefsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.VesselTypeRefs.AsNoTracking().ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] VesselTypeRefBody body)
    {
        var entity = new VesselTypeRef
        {
            PublicId                = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId                = body.TenantId ?? "default",
            PrimaryType             = body.PrimaryType,
            SubType                 = body.SubType,
            SizeMetric              = string.IsNullOrWhiteSpace(body.SizeMetric) ? null : body.SizeMetric,
            TypicalSizeRange        = string.IsNullOrWhiteSpace(body.TypicalSizeRange) ? null : body.TypicalSizeRange,
            DefiningCharacteristics = string.IsNullOrWhiteSpace(body.DefiningCharacteristics) ? null : body.DefiningCharacteristics,
            CapabilitiesSections    = string.IsNullOrWhiteSpace(body.CapabilitiesSections) ? null : body.CapabilitiesSections,
            SortOrder               = body.SortOrder,
            IsActive                = body.IsActive,
        };
        _db.VesselTypeRefs.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] VesselTypeRefBody body)
    {
        var entity = await _db.VesselTypeRefs.FirstOrDefaultAsync(v => v.Id == id);
        if (entity is null) return NotFound();

        entity.PrimaryType             = body.PrimaryType ?? entity.PrimaryType;
        entity.SubType                 = body.SubType ?? entity.SubType;
        entity.SizeMetric              = string.IsNullOrWhiteSpace(body.SizeMetric) ? null : body.SizeMetric;
        entity.TypicalSizeRange        = string.IsNullOrWhiteSpace(body.TypicalSizeRange) ? null : body.TypicalSizeRange;
        entity.DefiningCharacteristics = string.IsNullOrWhiteSpace(body.DefiningCharacteristics) ? null : body.DefiningCharacteristics;
        entity.CapabilitiesSections    = string.IsNullOrWhiteSpace(body.CapabilitiesSections) ? null : body.CapabilitiesSections;
        entity.SortOrder               = body.SortOrder;
        entity.IsActive                = body.IsActive;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.VesselTypeRefs.FirstOrDefaultAsync(v => v.Id == id);
        if (entity is null) return NotFound();
        _db.VesselTypeRefs.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record VesselTypeRefBody(
    string? PrimaryType,
    string? SubType,
    string? SizeMetric,
    string? TypicalSizeRange,
    string? DefiningCharacteristics,
    string? CapabilitiesSections,
    int?    SortOrder,
    bool    IsActive,
    string? PublicId = null,
    string? TenantId = null
);
