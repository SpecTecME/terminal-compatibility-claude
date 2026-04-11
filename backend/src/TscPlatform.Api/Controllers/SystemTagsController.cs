using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/system-tags")]
public class SystemTagsController : ControllerBase
{
    private readonly TscDbContext _db;

    public SystemTagsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tags = await _db.SystemTags.ToListAsync();
        return Ok(tags);
    }
}
