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
    public async Task<IActionResult> GetAll([FromQuery] string? terminalComplexPublicId)
    {
        var query = _db.Terminals.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(terminalComplexPublicId))
            query = query.Where(t => t.TerminalComplexPublicId == terminalComplexPublicId);
        return Ok(await query.ToListAsync());
    }
}
