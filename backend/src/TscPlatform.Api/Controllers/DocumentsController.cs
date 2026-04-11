using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase4;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly TscDbContext _db;

    public DocumentsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? vesselId)
    {
        var query = _db.Documents.AsNoTracking();
        if (vesselId.HasValue)
            query = query.Where(d => d.VesselId == vesselId.Value);
        return Ok(await query.ToListAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Document body)
    {
        body.Id = 0;
        if (string.IsNullOrWhiteSpace(body.PublicId)) body.PublicId = Guid.NewGuid().ToString();
        if (string.IsNullOrWhiteSpace(body.TenantId)) body.TenantId = "default";
        _db.Documents.Add(body);
        await _db.SaveChangesAsync();
        return Ok(body);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Document body)
    {
        var entity = await _db.Documents.FirstOrDefaultAsync(d => d.Id == id);
        if (entity is null) return NotFound();
        _db.Entry(entity).CurrentValues.SetValues(body);
        entity.Id = id;
        if (string.IsNullOrWhiteSpace(entity.PublicId)) entity.PublicId = Guid.NewGuid().ToString();
        if (string.IsNullOrWhiteSpace(entity.TenantId)) entity.TenantId = "default";
        await _db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Documents.FirstOrDefaultAsync(d => d.Id == id);
        if (entity is null) return NotFound();
        _db.Documents.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
