using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/country-aliases")]
public class CountryAliasesController : ControllerBase
{
    private readonly TscDbContext _db;

    public CountryAliasesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var aliases = await _db.CountryAliases.ToListAsync();
        return Ok(aliases);
    }
}
