using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/terminal-document-requirements")]
public class TerminalDocumentRequirementsController : ControllerBase
{
    private readonly TscDbContext _db;

    public TerminalDocumentRequirementsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? terminalPublicId, [FromQuery] string? berthPublicId)
    {
        var query = _db.TerminalDocumentRequirements.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(terminalPublicId))
            query = query.Where(r => r.TerminalPublicId == terminalPublicId);

        if (!string.IsNullOrWhiteSpace(berthPublicId))
            query = query.Where(r => r.BerthPublicId == berthPublicId);

        var items = await query.ToListAsync();
        return Ok(items);
    }
}
