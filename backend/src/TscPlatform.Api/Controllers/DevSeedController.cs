using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Data;
using TscPlatform.Api.Models.Phase3;

namespace TscPlatform.Api.Controllers;

/// <summary>
/// Development-only seed endpoint. Safe: only inserts when the target table is empty.
/// Remove or guard behind an env flag before production deployment.
/// </summary>
[ApiController]
[Route("api/dev")]
public class DevSeedController : ControllerBase
{
    private readonly TscDbContext _db;

    public DevSeedController(TscDbContext db) => _db = db;

    /// <summary>
    /// Seeds a small set of demo TerminalDocumentRequirements using real references from the DB.
    /// Only runs if the TerminalDocumentRequirement table is currently empty.
    /// </summary>
    [HttpPost("seed-terminal-requirements")]
    public async Task<IActionResult> SeedTerminalRequirements()
    {
        if (await _db.TerminalDocumentRequirements.AnyAsync())
            return Ok(new { skipped = true, reason = "Table already has data — seed not applied." });

        // Use Ras Laffan terminal (has berths LNG1/LNG2 in the seeded data)
        const string rasLaffanPublicId = "c57b6321-67b0-4cbf-8689-ec457e650162";
        const string lngBerth2PublicId = "e330785c-9185-48c1-8f88-3014a4c041e3";
        const string certOfRegistryPublicId = "b2c3d4e5-0002-0002-0002-000000000001";
        const string sireReportPublicId     = "b2c3d4e5-0002-0002-0002-000000000005";

        // Validate references exist
        var terminal = await _db.Terminals.AsNoTracking().FirstOrDefaultAsync(t => t.PublicId == rasLaffanPublicId);
        if (terminal is null)
            return BadRequest(new { error = "Ras Laffan terminal not found. Run the terminal data import first." });

        var docType1 = await _db.DocumentTypes.AsNoTracking().FirstOrDefaultAsync(d => d.PublicId == certOfRegistryPublicId);
        var docType2 = await _db.DocumentTypes.AsNoTracking().FirstOrDefaultAsync(d => d.PublicId == sireReportPublicId);
        if (docType1 is null || docType2 is null)
            return BadRequest(new { error = "Required document types not found. Run the document type data import first." });

        var berth = await _db.Berths.AsNoTracking().FirstOrDefaultAsync(b => b.PublicId == lngBerth2PublicId);

        var items = new List<TerminalDocumentRequirement>
        {
            // Terminal-level: Certificate of Registry required at Registration stage
            new()
            {
                PublicId             = Guid.NewGuid().ToString(),
                TenantId             = "default",
                TerminalPublicId     = rasLaffanPublicId,
                TerminalId           = rasLaffanPublicId,
                DocumentTypePublicId = certOfRegistryPublicId,
                DocumentTypeId       = certOfRegistryPublicId,
                AppliesLevel         = "Terminal",
                SubmissionStage      = "Registration",
                IsRequired           = true,
                EffectiveFrom        = new DateOnly(2026, 1, 1),
                ValidTo              = null,
                IsActive             = true,
                IsMandatory          = true,
                Priority             = 1,
                Notes                = "DEMO: Terminal-wide registration requirement",
            },
            // Terminal-level: SIRE Inspection Report required at PreVisit stage
            new()
            {
                PublicId             = Guid.NewGuid().ToString(),
                TenantId             = "default",
                TerminalPublicId     = rasLaffanPublicId,
                TerminalId           = rasLaffanPublicId,
                DocumentTypePublicId = sireReportPublicId,
                DocumentTypeId       = sireReportPublicId,
                AppliesLevel         = "Terminal",
                SubmissionStage      = "PreVisit",
                IsRequired           = true,
                EffectiveFrom        = new DateOnly(2026, 1, 1),
                ValidTo              = null,
                IsActive             = true,
                IsMandatory          = true,
                Priority             = 2,
                Notes                = "DEMO: SIRE report required before each visit",
            },
        };

        // Add berth-level requirement only if LNG2 berth exists
        if (berth is not null)
        {
            items.Add(new()
            {
                PublicId             = Guid.NewGuid().ToString(),
                TenantId             = "default",
                TerminalPublicId     = rasLaffanPublicId,
                TerminalId           = rasLaffanPublicId,
                BerthPublicId        = lngBerth2PublicId,
                BerthId              = lngBerth2PublicId,
                DocumentTypePublicId = sireReportPublicId,
                DocumentTypeId       = sireReportPublicId,
                AppliesLevel         = "Berth",
                SubmissionStage      = "PreVisit",
                IsRequired           = true,
                EffectiveFrom        = new DateOnly(2026, 1, 1),
                ValidTo              = null,
                IsActive             = true,
                IsMandatory          = true,
                Priority             = 1,
                Notes                = "DEMO: Berth-level SIRE requirement for LNG2",
            });
        }

        _db.TerminalDocumentRequirements.AddRange(items);
        await _db.SaveChangesAsync();

        return Ok(new
        {
            seeded = items.Count,
            terminalName = terminal.Name,
            berthIncluded = berth is not null
        });
    }
}
