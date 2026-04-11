using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/document-types")]
public class DocumentTypesController : ControllerBase
{
    private readonly TscDbContext _db;

    public DocumentTypesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var documentTypes = await _db.DocumentTypes.AsNoTracking().ToListAsync();
        return Ok(documentTypes);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DocumentTypeBody body)
    {
        int? categoryId = null;
        if (!string.IsNullOrWhiteSpace(body.CategoryPublicId))
        {
            var cat = await _db.DocumentCategories.FirstOrDefaultAsync(c => c.PublicId == body.CategoryPublicId);
            categoryId = cat?.Id;
        }

        var entity = new DocumentType
        {
            PublicId                 = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId                 = body.TenantId ?? "default",
            Name                     = body.Name,
            Code                     = string.IsNullOrWhiteSpace(body.Code) ? null : body.Code.Trim(),
            CategoryId               = categoryId,
            CategoryPublicId         = string.IsNullOrWhiteSpace(body.CategoryPublicId) ? null : body.CategoryPublicId,
            AppliesTo                = body.AppliesTo,
            DocumentValidityType     = body.DocumentValidityType,
            IsExpiryRequired         = body.IsExpiryRequired,
            DefaultValidityDuration  = body.DefaultValidityDuration,
            ValidityUnit             = body.ValidityUnit,
            ReminderLeadTime         = body.ReminderLeadTime,
            ReminderUnit             = body.ReminderUnit,
            IssuingAuthorityDefault  = string.IsNullOrWhiteSpace(body.IssuingAuthorityDefault) ? null : body.IssuingAuthorityDefault,
            AllowedIssuers           = body.AllowedIssuers ?? Array.Empty<string>(),
            IsActive                 = body.IsActive,
            SortOrder                = body.SortOrder,
            Description              = string.IsNullOrWhiteSpace(body.Description) ? null : body.Description.Trim(),
            Notes                    = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim()
        };
        _db.DocumentTypes.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{publicId}")]
    public async Task<IActionResult> Update(string publicId, [FromBody] DocumentTypeBody body)
    {
        var entity = await _db.DocumentTypes.FirstOrDefaultAsync(t => t.PublicId == publicId);
        if (entity is null) return NotFound();

        int? categoryId = entity.CategoryId;
        if (!string.IsNullOrWhiteSpace(body.CategoryPublicId))
        {
            var cat = await _db.DocumentCategories.FirstOrDefaultAsync(c => c.PublicId == body.CategoryPublicId);
            categoryId = cat?.Id;
        }
        else
        {
            categoryId = null;
        }

        entity.Name                    = body.Name;
        entity.Code                    = string.IsNullOrWhiteSpace(body.Code) ? null : body.Code.Trim();
        entity.CategoryId              = categoryId;
        entity.CategoryPublicId        = string.IsNullOrWhiteSpace(body.CategoryPublicId) ? null : body.CategoryPublicId;
        entity.AppliesTo               = body.AppliesTo;
        entity.DocumentValidityType    = body.DocumentValidityType;
        entity.IsExpiryRequired        = body.IsExpiryRequired;
        entity.DefaultValidityDuration = body.DefaultValidityDuration;
        entity.ValidityUnit            = body.ValidityUnit;
        entity.ReminderLeadTime        = body.ReminderLeadTime;
        entity.ReminderUnit            = body.ReminderUnit;
        entity.IssuingAuthorityDefault = string.IsNullOrWhiteSpace(body.IssuingAuthorityDefault) ? null : body.IssuingAuthorityDefault;
        entity.AllowedIssuers          = body.AllowedIssuers ?? Array.Empty<string>();
        entity.IsActive                = body.IsActive;
        entity.SortOrder               = body.SortOrder;
        entity.Description             = string.IsNullOrWhiteSpace(body.Description) ? null : body.Description.Trim();
        entity.Notes                   = string.IsNullOrWhiteSpace(body.Notes) ? null : body.Notes.Trim();
        await _db.SaveChangesAsync();
        return Ok(entity);
    }
}

public record DocumentTypeBody(
    string    Name,
    string?   Code,
    string?   CategoryPublicId,
    string?   AppliesTo,
    string?   DocumentValidityType,
    bool      IsExpiryRequired,
    int?      DefaultValidityDuration,
    string?   ValidityUnit,
    int?      ReminderLeadTime,
    string?   ReminderUnit,
    string?   IssuingAuthorityDefault,
    string[]? AllowedIssuers,
    bool      IsActive,
    int?      SortOrder,
    string?   Description,
    string?   Notes,
    string?   PublicId = null,
    string?   TenantId = null
);
