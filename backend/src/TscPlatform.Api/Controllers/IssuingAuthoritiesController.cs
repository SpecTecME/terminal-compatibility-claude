using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/issuing-authorities")]
public class IssuingAuthoritiesController : ControllerBase
{
    private readonly TscDbContext _db;

    public IssuingAuthoritiesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var authorities = await _db.IssuingAuthorities.ToListAsync();
        return Ok(authorities);
    }
}
