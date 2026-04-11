using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/terminal-types")]
public class TerminalTypesController : ControllerBase
{
    private readonly TscDbContext _db;

    public TerminalTypesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.TerminalTypes.ToListAsync();
        return Ok(items);
    }
}
