using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;

namespace TscPlatform.Api.Controllers;

[ApiController]
[Route("api/document-type-external-codes")]
public class DocumentTypeExternalCodesController : ControllerBase
{
    private readonly TscDbContext _db;

    public DocumentTypeExternalCodesController(TscDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.DocumentTypeExternalCodes.AsNoTracking().ToListAsync();
        return Ok(items);
    }
}
