using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/terminal-complexes")]
public class TerminalComplexesController : ControllerBase
{
    private readonly TscDbContext _db;

    public TerminalComplexesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.TerminalComplexes.ToListAsync();
        return Ok(items);
    }
}
