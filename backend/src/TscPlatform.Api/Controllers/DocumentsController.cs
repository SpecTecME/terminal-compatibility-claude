using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/documents")]
public class DocumentsController : ControllerBase
{
    private readonly TscDbContext _db;

    public DocumentsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? vesselId)
    {
        var query = _db.Documents.AsNoTracking();
        if (vesselId.HasValue)
            query = query.Where(d => d.VesselId == vesselId.Value);
        return Ok(await query.ToListAsync());
    }
}
