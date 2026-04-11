using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/maritime-zones")]
public class MaritimeZonesController : ControllerBase
{
    private readonly TscDbContext _db;

    public MaritimeZonesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.MaritimeZones.AsNoTracking().ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MaritimeZoneBody body)
    {
        var entity = new MaritimeZone
        {
            PublicId      = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId      = body.TenantId ?? "default",
            Code          = body.Code,
            Name          = body.Name,
            ZoneType      = body.ZoneType,
            Authority     = string.IsNullOrWhiteSpace(body.Authority) ? null : body.Authority,
            EffectiveFrom = body.EffectiveFrom,
            EffectiveTo   = body.EffectiveTo,
            Status        = string.IsNullOrWhiteSpace(body.Status) ? "Active" : body.Status,
            IsActive      = body.IsActive,
            DisplayOrder  = body.DisplayOrder,
            Color         = string.IsNullOrWhiteSpace(body.Color) ? null : body.Color,
            FillOpacity   = body.FillOpacity,
            StrokeOpacity = body.StrokeOpacity,
            StrokeWeight  = body.StrokeWeight,
            GeometryType  = string.IsNullOrWhiteSpace(body.GeometryType) ? null : body.GeometryType,
            GeoJson       = string.IsNullOrWhiteSpace(body.GeoJson) ? null : body.GeoJson,
            Notes         = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim(),
        };
        _db.MaritimeZones.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] MaritimeZoneBody body)
    {
        var entity = await _db.MaritimeZones.FirstOrDefaultAsync(z => z.Id == id);
        if (entity is null) return NotFound();

        entity.Code          = body.Code ?? entity.Code;
        entity.Name          = body.Name ?? entity.Name;
        entity.ZoneType      = body.ZoneType ?? entity.ZoneType;
        entity.Authority     = string.IsNullOrWhiteSpace(body.Authority) ? null : body.Authority;
        entity.EffectiveFrom = body.EffectiveFrom;
        entity.EffectiveTo   = body.EffectiveTo;
        entity.Status        = body.Status ?? entity.Status;
        entity.IsActive      = body.IsActive;
        entity.DisplayOrder  = body.DisplayOrder;
        entity.Color         = string.IsNullOrWhiteSpace(body.Color) ? null : body.Color;
        entity.FillOpacity   = body.FillOpacity;
        entity.StrokeOpacity = body.StrokeOpacity;
        entity.StrokeWeight  = body.StrokeWeight;
        entity.GeometryType  = string.IsNullOrWhiteSpace(body.GeometryType) ? null : body.GeometryType;
        entity.GeoJson       = string.IsNullOrWhiteSpace(body.GeoJson) ? null : body.GeoJson;
        entity.Notes         = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim();

        await _db.SaveChangesAsync();
        return Ok(entity);
    }
}

public record MaritimeZoneBody(
    string?  Code,
    string?  Name,
    string?  ZoneType,
    string?  Authority,
    string?  Status,
    bool     IsActive,
    int?     DisplayOrder,
    string?  Color,
    double?  FillOpacity,
    double?  StrokeOpacity,
    double?  StrokeWeight,
    string?  Notes,
    DateOnly? EffectiveFrom,
    DateOnly? EffectiveTo,
    string?  GeometryType,
    string?  GeoJson,
    string?  PublicId = null,
    string?  TenantId = null
);
