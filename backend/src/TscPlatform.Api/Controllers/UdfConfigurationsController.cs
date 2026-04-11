using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/udf-configurations")]
public class UdfConfigurationsController : ControllerBase
{
    private readonly TscDbContext _db;

    public UdfConfigurationsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.UdfConfigurations.ToListAsync();
        return Ok(items);
    }
}
