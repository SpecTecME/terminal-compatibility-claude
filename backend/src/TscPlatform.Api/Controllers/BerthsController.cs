using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/berths")]
public class BerthsController : ControllerBase
{
    private readonly TscDbContext _db;

    public BerthsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.Berths.ToListAsync();
        return Ok(items);
    }
}
