using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase4;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/vessels")]
public class VesselsController : ControllerBase
{
    private readonly TscDbContext _db;

    public VesselsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var vessels = await _db.Vessels.AsNoTracking().ToListAsync();
        return Ok(vessels);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Vessel body)
    {
        body.Id = 0;
        if (string.IsNullOrWhiteSpace(body.PublicId)) body.PublicId = Guid.NewGuid().ToString();
        if (string.IsNullOrWhiteSpace(body.TenantId)) body.TenantId = "default";
        _db.Vessels.Add(body);
        await _db.SaveChangesAsync();
        return Ok(body);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Vessel body)
    {
        var entity = await _db.Vessels.FirstOrDefaultAsync(v => v.Id == id);
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
        var entity = await _db.Vessels.FirstOrDefaultAsync(v => v.Id == id);
        if (entity is null) return NotFound();
        _db.Vessels.Remove(entity);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
