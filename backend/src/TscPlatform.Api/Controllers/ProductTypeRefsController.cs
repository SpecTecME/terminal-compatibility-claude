using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/product-types")]
public class ProductTypeRefsController : ControllerBase
{
    private readonly TscDbContext _db;

    public ProductTypeRefsController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.ProductTypeRefs.ToListAsync();
        return Ok(items);
    }
}
