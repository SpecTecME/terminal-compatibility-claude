using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/fuel-types")]
public class FuelTypeRefsController : ControllerBase
{
    private readonly TscDbContext _db;

    public FuelTypeRefsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.FuelTypeRefs.ToListAsync();
        return Ok(items);
    }
}
