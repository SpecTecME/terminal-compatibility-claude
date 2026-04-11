using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase3;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/terminal-complexes")]
public class TerminalComplexesController : ControllerBase
{
    private readonly TscDbContext _db;

    public TerminalComplexesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.TerminalComplexes.ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TerminalComplexBody body)
    {
        var entity = new TerminalComplex
        {
            PublicId           = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId           = body.TenantId ?? "default",
            Name               = body.Name ?? string.Empty,
            Code               = string.IsNullOrWhiteSpace(body.Code) ? null : body.Code,
            CountryId          = string.IsNullOrWhiteSpace(body.CountryId) ? null : body.CountryId,
            CountryPublicId    = string.IsNullOrWhiteSpace(body.CountryPublicId) ? null : body.CountryPublicId,
            Region             = string.IsNullOrWhiteSpace(body.Region) ? null : body.Region,
            City               = string.IsNullOrWhiteSpace(body.City) ? null : body.City,
            Address            = string.IsNullOrWhiteSpace(body.Address) ? null : body.Address,
            Latitude           = body.Latitude,
            Longitude          = body.Longitude,
            OperatorAuthority  = string.IsNullOrWhiteSpace(body.OperatorAuthority) ? null : body.OperatorAuthority,
            Notes              = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes,
            IsActive           = body.IsActive ?? true,
        };
        _db.TerminalComplexes.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] TerminalComplexBody body)
    {
        var entity = await _db.TerminalComplexes.FirstOrDefaultAsync(e => e.Id == id);
        if (entity is null) return NotFound();

        if (body.Name is not null)              entity.Name              = body.Name;
        if (body.Code               != null)    entity.Code              = string.IsNullOrWhiteSpace(body.Code) ? null : body.Code;
        if (body.CountryId          != null)    entity.CountryId         = string.IsNullOrWhiteSpace(body.CountryId) ? null : body.CountryId;
        if (body.CountryPublicId    != null)    entity.CountryPublicId   = string.IsNullOrWhiteSpace(body.CountryPublicId) ? null : body.CountryPublicId;
        if (body.Region             != null)    entity.Region            = string.IsNullOrWhiteSpace(body.Region) ? null : body.Region;
        if (body.City               != null)    entity.City              = string.IsNullOrWhiteSpace(body.City) ? null : body.City;
        if (body.Address            != null)    entity.Address           = string.IsNullOrWhiteSpace(body.Address) ? null : body.Address;
        if (body.Latitude.HasValue)             entity.Latitude          = body.Latitude;
        if (body.Longitude.HasValue)            entity.Longitude         = body.Longitude;
        if (body.OperatorAuthority  != null)    entity.OperatorAuthority = string.IsNullOrWhiteSpace(body.OperatorAuthority) ? null : body.OperatorAuthority;
        if (body.Notes              != null)    entity.Notes             = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes;
        if (body.IsActive.HasValue)             entity.IsActive          = body.IsActive.Value;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.TerminalComplexes.FirstOrDefaultAsync(e => e.Id == id);
        if (entity is null) return NotFound();
        _db.TerminalComplexes.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record TerminalComplexBody(
    string?  Name,
    string?  Code,
    string?  CountryId,
    string?  CountryPublicId,
    string?  Region,
    string?  City,
    string?  Address,
    double?  Latitude,
    double?  Longitude,
    string?  OperatorAuthority,
    string?  Notes,
    bool?    IsActive,
    string?  PublicId = null,
    string?  TenantId = null
);
