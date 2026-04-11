using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/terminals")]
public class TerminalsController : ControllerBase
{
    private readonly TscDbContext _db;

    public TerminalsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.Terminals.ToListAsync();
        return Ok(items);
    }
}
