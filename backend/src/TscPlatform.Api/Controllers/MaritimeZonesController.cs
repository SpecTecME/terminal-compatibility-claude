using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

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
        var items = await _db.MaritimeZones.ToListAsync();
        return Ok(items);
    }
}
