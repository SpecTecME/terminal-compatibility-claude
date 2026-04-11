using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/udf-list-values")]
public class UdfListValuesController : ControllerBase
{
    private readonly TscDbContext _db;

    public UdfListValuesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.UdfListValues.ToListAsync();
        return Ok(items);
    }
}
