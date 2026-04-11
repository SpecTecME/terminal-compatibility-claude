using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase2;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/companies")]
public class CompaniesController : ControllerBase
{
    private readonly TscDbContext _db;

    public CompaniesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var companies = await _db.Companies.AsNoTracking().ToListAsync();
        return Ok(companies);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CompanyBody body)
    {
        var entity = new Company
        {
            PublicId            = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId            = body.TenantId ?? "default",
            Name                = body.Name ?? string.Empty,
            LegalName           = string.IsNullOrWhiteSpace(body.LegalName) ? null : body.LegalName,
            Type                = string.IsNullOrWhiteSpace(body.Type) ? null : body.Type,
            CountryId           = body.CountryId,
            CountryPublicId     = string.IsNullOrWhiteSpace(body.CountryPublicId) ? null : body.CountryPublicId,
            Phone               = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone,
            Email               = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email,
            Website             = string.IsNullOrWhiteSpace(body.Website) ? null : body.Website,
            HqAddressLine1      = string.IsNullOrWhiteSpace(body.HqAddressLine1) ? null : body.HqAddressLine1,
            HqCity              = string.IsNullOrWhiteSpace(body.HqCity) ? null : body.HqCity,
            HqPostalCode        = string.IsNullOrWhiteSpace(body.HqPostalCode) ? null : body.HqPostalCode,
            HqCountryId         = body.HqCountryId,
            HqCountryPublicId   = string.IsNullOrWhiteSpace(body.HqCountryPublicId) ? null : body.HqCountryPublicId,
            IacsMember          = body.IacsMember,
            Notes               = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes,
            IsActive            = body.IsActive,
            SortOrder           = body.SortOrder,
            MainContactId       = body.MainContactId,
            MainContactPublicId = string.IsNullOrWhiteSpace(body.MainContactPublicId) ? null : body.MainContactPublicId,
        };
        _db.Companies.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] CompanyBody body)
    {
        var entity = await _db.Companies.FirstOrDefaultAsync(c => c.Id == id);
        if (entity is null) return NotFound();

        entity.Name                = body.Name ?? entity.Name;
        entity.LegalName           = string.IsNullOrWhiteSpace(body.LegalName) ? null : body.LegalName;
        entity.Type                = string.IsNullOrWhiteSpace(body.Type) ? null : body.Type;
        entity.CountryId           = body.CountryId;
        entity.CountryPublicId     = string.IsNullOrWhiteSpace(body.CountryPublicId) ? null : body.CountryPublicId;
        entity.Phone               = string.IsNullOrWhiteSpace(body.Phone) ? null : body.Phone;
        entity.Email               = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email;
        entity.Website             = string.IsNullOrWhiteSpace(body.Website) ? null : body.Website;
        entity.HqAddressLine1      = string.IsNullOrWhiteSpace(body.HqAddressLine1) ? null : body.HqAddressLine1;
        entity.HqCity              = string.IsNullOrWhiteSpace(body.HqCity) ? null : body.HqCity;
        entity.HqPostalCode        = string.IsNullOrWhiteSpace(body.HqPostalCode) ? null : body.HqPostalCode;
        entity.HqCountryId         = body.HqCountryId;
        entity.HqCountryPublicId   = string.IsNullOrWhiteSpace(body.HqCountryPublicId) ? null : body.HqCountryPublicId;
        entity.IacsMember          = body.IacsMember;
        entity.Notes               = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes;
        entity.IsActive            = body.IsActive;
        entity.SortOrder           = body.SortOrder;
        entity.MainContactId       = body.MainContactId;
        entity.MainContactPublicId = string.IsNullOrWhiteSpace(body.MainContactPublicId) ? null : body.MainContactPublicId;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Companies.FirstOrDefaultAsync(c => c.Id == id);
        if (entity is null) return NotFound();
        _db.Companies.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record CompanyBody(
    string? Name,
    string? LegalName,
    string? Type,
    int?    CountryId,
    string? CountryPublicId,
    string? Phone,
    string? Email,
    string? Website,
    string? HqAddressLine1,
    string? HqCity,
    string? HqPostalCode,
    int?    HqCountryId,
    string? HqCountryPublicId,
    bool    IacsMember,
    string? Notes,
    bool    IsActive,
    int?    SortOrder,
    int?    MainContactId,
    string? MainContactPublicId,
    string? PublicId  = null,
    string? TenantId  = null
);
