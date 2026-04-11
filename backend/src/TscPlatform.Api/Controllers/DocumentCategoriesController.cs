using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/document-categories")]
public class DocumentCategoriesController : ControllerBase
{
    private readonly TscDbContext _db;

    public DocumentCategoriesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.DocumentCategories.AsNoTracking().ToListAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] DocumentCategoryBody body)
    {
        var entity = new DocumentCategory
        {
            PublicId    = body.PublicId ?? Guid.NewGuid().ToString(),
            TenantId    = body.TenantId ?? "default",
            Name        = body.Name,
            Description = string.IsNullOrWhiteSpace(body.Description) ? null : body.Description.Trim(),
            IsActive    = body.IsActive,
            SortOrder   = body.SortOrder
        };
        _db.DocumentCategories.Add(entity);
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpPut("{publicId}")]
    public async Task<IActionResult> Update(string publicId, [FromBody] DocumentCategoryBody body)
    {
        var entity = await _db.DocumentCategories.FirstOrDefaultAsync(c => c.PublicId == publicId);
        if (entity is null) return NotFound();

        entity.Name        = body.Name;
        entity.Description = string.IsNullOrWhiteSpace(body.Description) ? null : body.Description.Trim();
        entity.IsActive    = body.IsActive;
        entity.SortOrder   = body.SortOrder;
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{publicId}")]
    public async Task<IActionResult> Delete(string publicId)
    {
        var entity = await _db.DocumentCategories.FirstOrDefaultAsync(c => c.PublicId == publicId);
        if (entity is null) return NotFound();
        _db.DocumentCategories.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

public record DocumentCategoryBody(
    string  Name,
    string? Description,
    bool    IsActive,
    int?    SortOrder,
    string? PublicId  = null,
    string? TenantId  = null
);
