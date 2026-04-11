using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/vessel-types")]
public class VesselTypeRefsController : ControllerBase
{
    private readonly TscDbContext _db;

    public VesselTypeRefsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.VesselTypeRefs.ToListAsync();
        return Ok(items);
    }
}
