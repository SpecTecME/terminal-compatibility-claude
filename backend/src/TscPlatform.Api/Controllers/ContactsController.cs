using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase2;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/contacts")]
public class ContactsController : ControllerBase
{
    private readonly TscDbContext _db;

    public ContactsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var contacts = await _db.Contacts.AsNoTracking().ToListAsync();
        return Ok(contacts);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ContactBody body)
    {
        var entity = new Contact
        {
            PublicId                = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId                = body.TenantId ?? "default",
            IsGroupEmail            = body.IsGroupEmail,
            GroupName               = string.IsNullOrWhiteSpace(body.GroupName) ? null : body.GroupName,
            FirstName               = string.IsNullOrWhiteSpace(body.FirstName) ? null : body.FirstName,
            LastName                = string.IsNullOrWhiteSpace(body.LastName) ? null : body.LastName,
            PreferredName           = string.IsNullOrWhiteSpace(body.PreferredName) ? null : body.PreferredName,
            Email                   = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email,
            PhoneMobile             = string.IsNullOrWhiteSpace(body.PhoneMobile) ? null : body.PhoneMobile,
            PhoneOffice             = string.IsNullOrWhiteSpace(body.PhoneOffice) ? null : body.PhoneOffice,
            Whatsapp                = string.IsNullOrWhiteSpace(body.Whatsapp) ? null : body.Whatsapp,
            PreferredContactMethod  = string.IsNullOrWhiteSpace(body.PreferredContactMethod) ? null : body.PreferredContactMethod,
            Timezone                = string.IsNullOrWhiteSpace(body.Timezone) ? null : body.Timezone,
            CompanyId               = body.CompanyId,
            CompanyPublicId         = string.IsNullOrWhiteSpace(body.CompanyPublicId) ? null : body.CompanyPublicId,
            OfficeId                = body.OfficeId,
            OfficePublicId          = string.IsNullOrWhiteSpace(body.OfficePublicId) ? null : body.OfficePublicId,
            CountryId               = body.CountryId,
            CountryPublicId         = string.IsNullOrWhiteSpace(body.CountryPublicId) ? null : body.CountryPublicId,
            TerminalId              = body.TerminalId,
            TerminalPublicId        = string.IsNullOrWhiteSpace(body.TerminalPublicId) ? null : body.TerminalPublicId,
            JobTitle                = string.IsNullOrWhiteSpace(body.JobTitle) ? null : body.JobTitle,
            Department              = string.IsNullOrWhiteSpace(body.Department) ? null : body.Department,
            Location                = string.IsNullOrWhiteSpace(body.Location) ? null : body.Location,
            DateOfBirth             = body.DateOfBirth,
            ReligionOrObservance    = string.IsNullOrWhiteSpace(body.ReligionOrObservance) ? null : body.ReligionOrObservance,
            ObservanceNotes         = string.IsNullOrWhiteSpace(body.ObservanceNotes) ? null : body.ObservanceNotes,
            CriticalRole            = string.IsNullOrWhiteSpace(body.CriticalRole) ? "None" : body.CriticalRole,
            IsActive                = body.IsActive,
            Notes                   = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes,
        };
        _db.Contacts.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ContactBody body)
    {
        var entity = await _db.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        if (entity is null) return NotFound();

        entity.IsGroupEmail            = body.IsGroupEmail;
        entity.GroupName               = string.IsNullOrWhiteSpace(body.GroupName) ? null : body.GroupName;
        entity.FirstName               = string.IsNullOrWhiteSpace(body.FirstName) ? null : body.FirstName;
        entity.LastName                = string.IsNullOrWhiteSpace(body.LastName) ? null : body.LastName;
        entity.PreferredName           = string.IsNullOrWhiteSpace(body.PreferredName) ? null : body.PreferredName;
        entity.Email                   = string.IsNullOrWhiteSpace(body.Email) ? null : body.Email;
        entity.PhoneMobile             = string.IsNullOrWhiteSpace(body.PhoneMobile) ? null : body.PhoneMobile;
        entity.PhoneOffice             = string.IsNullOrWhiteSpace(body.PhoneOffice) ? null : body.PhoneOffice;
        entity.Whatsapp                = string.IsNullOrWhiteSpace(body.Whatsapp) ? null : body.Whatsapp;
        entity.PreferredContactMethod  = string.IsNullOrWhiteSpace(body.PreferredContactMethod) ? null : body.PreferredContactMethod;
        entity.Timezone                = string.IsNullOrWhiteSpace(body.Timezone) ? null : body.Timezone;
        entity.CompanyId               = body.CompanyId;
        entity.CompanyPublicId         = string.IsNullOrWhiteSpace(body.CompanyPublicId) ? null : body.CompanyPublicId;
        entity.OfficeId                = body.OfficeId;
        entity.OfficePublicId          = string.IsNullOrWhiteSpace(body.OfficePublicId) ? null : body.OfficePublicId;
        entity.CountryId               = body.CountryId;
        entity.CountryPublicId         = string.IsNullOrWhiteSpace(body.CountryPublicId) ? null : body.CountryPublicId;
        entity.TerminalId              = body.TerminalId;
        entity.TerminalPublicId        = string.IsNullOrWhiteSpace(body.TerminalPublicId) ? null : body.TerminalPublicId;
        entity.JobTitle                = string.IsNullOrWhiteSpace(body.JobTitle) ? null : body.JobTitle;
        entity.Department              = string.IsNullOrWhiteSpace(body.Department) ? null : body.Department;
        entity.Location                = string.IsNullOrWhiteSpace(body.Location) ? null : body.Location;
        entity.DateOfBirth             = body.DateOfBirth;
        entity.ReligionOrObservance    = string.IsNullOrWhiteSpace(body.ReligionOrObservance) ? null : body.ReligionOrObservance;
        entity.ObservanceNotes         = string.IsNullOrWhiteSpace(body.ObservanceNotes) ? null : body.ObservanceNotes;
        entity.CriticalRole            = string.IsNullOrWhiteSpace(body.CriticalRole) ? "None" : body.CriticalRole;
        entity.IsActive                = body.IsActive;
        entity.Notes                   = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes;

        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        if (entity is null) return NotFound();
        _db.Contacts.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record ContactBody(
    bool    IsGroupEmail,
    string? GroupName,
    string? FirstName,
    string? LastName,
    string? PreferredName,
    string? Email,
    string? PhoneMobile,
    string? PhoneOffice,
    string? Whatsapp,
    string? PreferredContactMethod,
    string? Timezone,
    int?    CompanyId,
    string? CompanyPublicId,
    int?    OfficeId,
    string? OfficePublicId,
    int?    CountryId,
    string? CountryPublicId,
    int?    TerminalId,
    string? TerminalPublicId,
    string? JobTitle,
    string? Department,
    string? Location,
    DateOnly? DateOfBirth,
    string? ReligionOrObservance,
    string? ObservanceNotes,
    string? CriticalRole,
    bool    IsActive,
    string? Notes,
    string? PublicId = null,
    string? TenantId = null
);
