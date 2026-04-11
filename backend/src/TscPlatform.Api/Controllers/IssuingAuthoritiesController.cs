using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/issuing-authorities")]
public class IssuingAuthoritiesController : ControllerBase
{
    private readonly TscDbContext _db;

    public IssuingAuthoritiesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var authorities = await _db.IssuingAuthorities.AsNoTracking().ToListAsync();
        return Ok(authorities);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] IssuingAuthorityBody body)
    {
        var entity = new IssuingAuthority
        {
            PublicId      = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId      = body.TenantId ?? "default",
            Name          = body.Name,
            AuthorityType = body.AuthorityType,
            CountryId     = body.CountryId,
            CountryPublicId = string.IsNullOrWhiteSpace(body.CountryPublicId) ? null : body.CountryPublicId,
            CompanyId     = string.IsNullOrWhiteSpace(body.CompanyId) ? null : body.CompanyId,
            CompanyPublicId = string.IsNullOrWhiteSpace(body.CompanyPublicId) ? null : body.CompanyPublicId,
            ContactEmail  = string.IsNullOrWhiteSpace(body.ContactEmail) ? null : body.ContactEmail,
            Website       = string.IsNullOrWhiteSpace(body.Website) ? null : body.Website,
            Notes         = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim(),
        };
        _db.IssuingAuthorities.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] IssuingAuthorityBody body)
    {
        var entity = await _db.IssuingAuthorities.FirstOrDefaultAsync(a => a.Id == id);
        if (entity is null) return NotFound();

        entity.Name           = body.Name ?? entity.Name;
        entity.AuthorityType  = body.AuthorityType ?? entity.AuthorityType;
        entity.CountryId      = body.CountryId;
        entity.CountryPublicId = string.IsNullOrWhiteSpace(body.CountryPublicId) ? null : body.CountryPublicId;
        entity.CompanyId      = string.IsNullOrWhiteSpace(body.CompanyId) ? null : body.CompanyId;
        entity.CompanyPublicId = string.IsNullOrWhiteSpace(body.CompanyPublicId) ? null : body.CompanyPublicId;
        entity.ContactEmail   = string.IsNullOrWhiteSpace(body.ContactEmail) ? null : body.ContactEmail;
        entity.Website        = string.IsNullOrWhiteSpace(body.Website) ? null : body.Website;
        entity.Notes          = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim();

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.IssuingAuthorities.FirstOrDefaultAsync(a => a.Id == id);
        if (entity is null) return NotFound();
        _db.IssuingAuthorities.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record IssuingAuthorityBody(
    string? Name,
    [property: JsonPropertyName("authority_type")] string? AuthorityType,
    int?    CountryId,
    string? CountryPublicId,
    string? CompanyId,
    string? CompanyPublicId,
    [property: JsonPropertyName("contact_email")] string? ContactEmail,
    string? Website,
    string? Notes,
    string? PublicId = null,
    string? TenantId = null
);
