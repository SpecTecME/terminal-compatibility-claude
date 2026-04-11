using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using System.Text.Json;
using TscPlatform.Api.Models.Phase3;

namespace TscPlatform.Api.Data;

/// <summary>
/// Imports Phase 3 transactional data: TerminalComplex, Terminal, Berth.
/// Safe to run multiple times — existing rows (matched by publicId) are skipped.
/// Rows where is_sample = "true" are always skipped.
/// TerminalComplex has no CSV export — table will be empty until populated via UI.
/// </summary>
public static class Phase3Importer
{
    private static readonly CsvConfiguration CsvConfig = new(CultureInfo.InvariantCulture)
    {
        HeaderValidated = null,
        MissingFieldFound = null,
        BadDataFound = null,
    };

    public static async Task ImportAsync(TscDbContext db, string dataDir)
    {
        Console.WriteLine($"Data directory: {Path.GetFullPath(dataDir)}");

        await ImportTerminalsAsync(db, dataDir);
        await ImportBerthsAsync(db, dataDir);

        Console.WriteLine("Phase 3 import complete.");
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static IEnumerable<Dictionary<string, string>> ReadCsv(string filePath)
    {
        using var reader = new StreamReader(filePath);
        using var csv    = new CsvReader(reader, CsvConfig);
        csv.Read();
        csv.ReadHeader();
        while (csv.Read())
        {
            var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var header in csv.HeaderRecord!)
                row[header] = csv.GetField(header) ?? string.Empty;
            yield return row;
        }
    }

    private static string S(Dictionary<string, string> row, string key)
        => row.TryGetValue(key, out var v) ? v.Trim() : string.Empty;

    private static bool B(Dictionary<string, string> row, string key)
        => S(row, key).Equals("true", StringComparison.OrdinalIgnoreCase);

    private static int? I(Dictionary<string, string> row, string key)
    {
        var v = S(row, key);
        return int.TryParse(v, out var n) ? n : null;
    }

    private static double? Dbl(Dictionary<string, string> row, string key)
    {
        var v = S(row, key);
        return double.TryParse(v, NumberStyles.Any, CultureInfo.InvariantCulture, out var n) ? n : null;
    }

    private static DateOnly? Date(Dictionary<string, string> row, string key)
    {
        var v = S(row, key);
        if (string.IsNullOrEmpty(v)) return null;
        if (DateOnly.TryParse(v, out var d)) return d;
        return null;
    }

    private static DateTime? Dt(Dictionary<string, string> row, string key)
    {
        var v = S(row, key);
        if (string.IsNullOrEmpty(v)) return null;
        if (DateTime.TryParse(v, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var d))
            return d.ToUniversalTime();
        return null;
    }

    private static string[] ParseJsonStringArray(Dictionary<string, string> row, string key)
    {
        var v = S(row, key);
        if (string.IsNullOrEmpty(v) || v == "[]") return Array.Empty<string>();
        try
        {
            return JsonSerializer.Deserialize<string[]>(v) ?? Array.Empty<string>();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }

    private static bool IsSample(Dictionary<string, string> row)
        => B(row, "is_sample");

    private static string CsvPath(string dataDir, string filename)
        => Path.Combine(dataDir, filename);

    // -------------------------------------------------------------------------
    // Terminal
    // -------------------------------------------------------------------------

    private static async Task ImportTerminalsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "Terminal_export-6.csv");
        if (!File.Exists(file)) { Console.WriteLine($"  SKIP (not found): {file}"); return; }

        var existing = db.Terminals.ToDictionary(t => t.PublicId, t => t.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            var entity = new Terminal
            {
                PublicId                = publicId,
                TenantId                = S(row, "tenantId") is { Length: > 0 } tid ? tid : "default-tenant",
                Name                    = S(row, "name"),
                Port                    = S(row, "port").NullIfEmpty(),
                CountryId               = S(row, "countryId").NullIfEmpty(),
                CountryPublicId         = S(row, "countryPublicId").NullIfEmpty(),
                LegacyCountryCode       = S(row, "legacyCountryCode").NullIfEmpty(),
                LegacyCountryName       = S(row, "legacyCountryName").NullIfEmpty(),
                SiteId                  = S(row, "siteId").NullIfEmpty(),
                SitePublicId            = S(row, "sitePublicId").NullIfEmpty(),
                TerminalComplexId       = S(row, "terminalComplexId").NullIfEmpty(),
                TerminalComplexPublicId = S(row, "terminalComplexPublicId").NullIfEmpty(),
                ProductTypeRefId        = S(row, "productTypeRefId").NullIfEmpty(),
                ProductTypeRefPublicId  = S(row, "productTypeRefPublicId").NullIfEmpty(),
                TerminalTypeId          = S(row, "terminal_type_id").NullIfEmpty(),
                TerminalTypePublicId    = S(row, "terminal_type_public_id").NullIfEmpty(),
                Latitude                = Dbl(row, "latitude"),
                Longitude               = Dbl(row, "longitude"),
                OperationType           = S(row, "operation_type").NullIfEmpty(),
                Operator                = S(row, "operator").NullIfEmpty(),
                Status                  = S(row, "status").NullIfEmpty(),
                IsActive                = !row.ContainsKey("isActive") || B(row, "isActive"),
                IsArchived              = B(row, "isArchived"),
                ArchivedAt              = Dt(row, "archivedAt"),
                ArchivedReason          = S(row, "archivedReason").NullIfEmpty(),
                ContactEmail            = S(row, "contact_email").NullIfEmpty(),
                ContactPhone            = S(row, "contact_phone").NullIfEmpty(),
                Website                 = S(row, "website").NullIfEmpty(),
                Timezone                = S(row, "timezone").NullIfEmpty(),
                Description             = S(row, "description").NullIfEmpty(),
                CapacityMtpa            = Dbl(row, "capacity_mtpa"),
                StorageCapacity         = Dbl(row, "storage_capacity"),
                NumberOfTanks           = I(row, "number_of_tanks"),
                LoadingRate             = Dbl(row, "loading_rate"),
                ApproachChannelDepth    = Dbl(row, "approach_channel_depth"),
                PilotageRequired        = B(row, "pilotage_required"),
                TugsAvailable           = B(row, "tugs_available"),
                Notes                   = S(row, "notes").NullIfEmpty(),
                ProcedureNotes          = S(row, "procedureNotes").NullIfEmpty(),
                FormsNotes              = S(row, "formsNotes").NullIfEmpty(),
            };

            db.Terminals.Add(entity);
            existing[publicId] = 0;
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  Terminal: {added} added.");
    }

    // -------------------------------------------------------------------------
    // Berth
    // -------------------------------------------------------------------------

    private static async Task ImportBerthsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "Berth_export-4.csv");
        if (!File.Exists(file)) { Console.WriteLine($"  SKIP (not found): {file}"); return; }

        var existing = db.Berths.ToDictionary(b => b.PublicId, b => b.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            var entity = new Berth
            {
                PublicId                = publicId,
                TenantId                = S(row, "tenantId") is { Length: > 0 } tid ? tid : "default-tenant",
                TerminalPublicId        = S(row, "terminalPublicId"),
                BerthCode               = S(row, "berthCode").NullIfEmpty(),
                BerthName               = S(row, "berthName").NullIfEmpty(),
                BerthNumber             = S(row, "berth_number").NullIfEmpty(),
                BerthType               = S(row, "berthType").NullIfEmpty(),
                ProductTypeRefIds       = ParseJsonStringArray(row, "productTypeRefIds"),
                MaxLoa                  = Dbl(row, "max_loa"),
                MaxBeam                 = Dbl(row, "max_beam"),
                MaxDraft                = Dbl(row, "max_draft"),
                MinCargoCapacity        = Dbl(row, "min_cargo_capacity"),
                MaxCargoCapacity        = Dbl(row, "max_cargo_capacity"),
                QmaxCapable             = B(row, "qmaxCapable"),
                QflexCapable            = B(row, "qflexCapable"),
                MaxCargoCapacityM3      = Dbl(row, "maxCargoCapacityM3"),
                MaxLoaM                 = Dbl(row, "maxLOAM"),
                MaxBeamM                = Dbl(row, "maxBeamM"),
                MaxArrivalDraftM        = Dbl(row, "maxArrivalDraftM"),
                MaxArrivalDisplacementT = Dbl(row, "maxArrivalDisplacementT"),
                ManifoldLimitsNotes     = S(row, "manifoldLimitsNotes").NullIfEmpty(),
                ManifoldHeightMin       = Dbl(row, "manifold_height_min"),
                ManifoldHeightMax       = Dbl(row, "manifold_height_max"),
                LoadingArmsLngCount     = I(row, "loadingArmsLngCount"),
                VapourReturnAvailable   = B(row, "vapourReturnAvailable"),
                TypicalLoadingRateNotes = S(row, "typicalLoadingRateNotes").NullIfEmpty(),
                LoadingArms             = I(row, "loading_arms"),
                FendersType             = S(row, "fenders_type").NullIfEmpty(),
                BollardsCapacity        = Dbl(row, "bollards_capacity"),
                Operator                = S(row, "operator").NullIfEmpty(),
                DataSource              = S(row, "dataSource").NullIfEmpty(),
                LastVerifiedDate        = Date(row, "lastVerifiedDate"),
                Description             = S(row, "description").NullIfEmpty(),
                Status                  = S(row, "status").NullIfEmpty(),
                Notes                   = S(row, "notes").NullIfEmpty(),
                IsArchived              = B(row, "isArchived"),
                ArchivedAt              = Dt(row, "archivedAt"),
                ArchivedReason          = S(row, "archivedReason").NullIfEmpty(),
            };

            db.Berths.Add(entity);
            existing[publicId] = 0;
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  Berth: {added} added.");
    }
}

internal static class StringExtensions
{
    public static string? NullIfEmpty(this string? s)
        => string.IsNullOrWhiteSpace(s) ? null : s;
}
