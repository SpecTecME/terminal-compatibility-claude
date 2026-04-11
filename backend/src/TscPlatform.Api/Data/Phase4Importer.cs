using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using TscPlatform.Api.Models.Phase4;

namespace TscPlatform.Api.Data;

/// <summary>
/// Imports Phase 4 transactional data: Vessel, Document.
/// Safe to run multiple times — existing rows (matched by publicId) are skipped.
/// Rows where is_sample = "true" are always skipped.
///
/// TerminalComplex has no CSV export in initial_data — table remains empty until
/// populated via UI or a future data export is provided.
/// Terminal.TerminalComplexPublicId is also empty in the source data — no linking
/// data available to populate.
/// </summary>
public static class Phase4Importer
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

        await ImportVesselsAsync(db, dataDir);
        await ImportDocumentsAsync(db, dataDir);

        Console.WriteLine("Phase 4 import complete.");
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
        // Handles "2020-02-11", "2020-02-11T00:00:00", etc.
        if (DateOnly.TryParse(v, out var d)) return d;
        if (DateTime.TryParse(v, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return DateOnly.FromDateTime(dt);
        return null;
    }

    private static bool IsSample(Dictionary<string, string> row)
        => B(row, "is_sample");

    private static string CsvPath(string dataDir, string filename)
        => Path.Combine(dataDir, filename);

    // -------------------------------------------------------------------------
    // Vessel
    // -------------------------------------------------------------------------

    private static async Task ImportVesselsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "Vessel_export-3.csv");
        if (!File.Exists(file)) { Console.WriteLine($"  SKIP (not found): {file}"); return; }

        var existing = db.Vessels.ToDictionary(v => v.PublicId, v => v.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            var entity = new Vessel
            {
                PublicId                 = publicId,
                TenantId                 = S(row, "tenantId") is { Length: > 0 } tid ? tid : "default-tenant",
                Name                     = S(row, "name"),
                VesselInternalId         = S(row, "vesselInternalId").NullIfEmpty(),
                ImoNumber                = S(row, "imoNumber").NullIfEmpty(),
                Mmsi                     = S(row, "mmsi").NullIfEmpty(),
                CallSign                 = S(row, "callSign").NullIfEmpty(),

                VesselTypeRefPublicId    = S(row, "vesselTypeRefPublicId").NullIfEmpty(),
                FlagCountryPublicId      = S(row, "flagCountryPublicId").NullIfEmpty(),
                OwnerCompanyPublicId     = S(row, "ownerCompanyPublicId").NullIfEmpty(),
                OperatorCompanyPublicId  = S(row, "operatorCompanyPublicId").NullIfEmpty(),
                ClassSocietyCompanyPublicId = S(row, "classSocietyCompanyPublicId").NullIfEmpty(),

                Udf01                    = S(row, "udf01").NullIfEmpty(),
                Udf02                    = S(row, "udf02").NullIfEmpty(),

                YearBuilt                = I(row, "yearBuilt"),
                Shipyard                 = S(row, "shipyard").NullIfEmpty(),
                ClassNotation            = S(row, "classNotation").NullIfEmpty(),

                LoaM                     = Dbl(row, "loa_m"),
                WidthM                   = Dbl(row, "width_m"),
                BeamM                    = Dbl(row, "beam_m"),
                DepthM                   = Dbl(row, "depth_m"),
                LbpM                     = Dbl(row, "lbpM"),
                MouldedDepthM            = Dbl(row, "mouldedDepthM"),
                BreadthMouldedM          = Dbl(row, "breadthMouldedM"),
                SummerDraftM             = Dbl(row, "summerDraftM"),
                DesignDraftM             = Dbl(row, "designDraft_m"),
                MaxDraftM                = Dbl(row, "maxDraft_m"),
                AirDraftM                = Dbl(row, "airDraft_m"),
                DisplacementSummerT      = Dbl(row, "displacementSummer_t"),
                Gt                       = Dbl(row, "gt"),
                NtItc69                  = Dbl(row, "ntItc69"),
                Dwt                      = Dbl(row, "dwt"),

                CargoContainmentType     = S(row, "cargoContainmentType").NullIfEmpty(),
                CargoCapacityM3          = Dbl(row, "cargoCapacity_m3"),
                MaxLoadingRateM3Ph       = Dbl(row, "maxLoadingRate_m3ph"),
                MaxDischargeRateM3Ph     = Dbl(row, "maxDischargeRate_m3ph"),
                VapourReturnSupported    = B(row, "vapourReturnSupported"),
                EsdErcType               = S(row, "esdErcType").NullIfEmpty(),
                BerthingSideSupported    = S(row, "berthingSideSupported").NullIfEmpty(),

                ManifoldLngCount         = I(row, "manifoldLngCount"),
                ManifoldVapourCount      = I(row, "manifoldVapourCount"),
                LngManifoldHeightMinM    = Dbl(row, "lngManifoldHeightMin_m"),
                LngManifoldHeightMaxM    = Dbl(row, "lngManifoldHeightMax_m"),
                VapourManifoldHeightMinM = Dbl(row, "vapourManifoldHeightMin_m"),
                VapourManifoldHeightMaxM = Dbl(row, "vapourManifoldHeightMax_m"),
                ManifoldSpacingPitchMm   = Dbl(row, "manifoldSpacingPitch_mm"),
                ManifoldToBowM           = Dbl(row, "manifoldToBow_m"),
                ManifoldToSternM         = Dbl(row, "manifoldToStern_m"),
                FlangeSizeLngIn          = S(row, "flangeSizeLng_in").NullIfEmpty(),
                FlangeRating             = S(row, "flangeRating").NullIfEmpty(),
                ErcManufacturerModel     = S(row, "ercManufacturerModel").NullIfEmpty(),

                MooringWinches           = I(row, "mooringWinches"),
                MooringLinesTotal        = I(row, "mooringLinesTotal"),
                HeadLines                = I(row, "headLines"),
                BreastLinesForward       = I(row, "breastLinesForward"),
                SpringsForward           = I(row, "springsForward"),
                SternLines               = I(row, "sternLines"),
                BreastLinesAft           = I(row, "breastLinesAft"),
                SpringsAft               = I(row, "springsAft"),
                LineType                 = S(row, "lineType").NullIfEmpty(),
                LineMblKn                = Dbl(row, "lineMBL_kN"),
                BrakeHoldingCapacityKn   = Dbl(row, "brakeHoldingCapacity_kN"),
                ChockType                = S(row, "chockType").NullIfEmpty(),
                FairleadChockPositionsNotes = S(row, "fairleadChockPositionsNotes").NullIfEmpty(),

                FenderContactZone        = S(row, "fenderContactZone").NullIfEmpty(),
                ShellPlatingRestrictions = S(row, "shellPlatingRestrictions").NullIfEmpty(),
                FenderPointLoadLimitKn   = Dbl(row, "fenderPointLoadLimit_kN"),
                PreferredFenderType      = S(row, "preferredFenderType").NullIfEmpty(),
                MaxWindBerthingKn        = Dbl(row, "maxWindBerthing_kn"),
                MaxWindAlongsideKn       = Dbl(row, "maxWindAlongside_kn"),
                MaxCurrentAlongsideKn    = Dbl(row, "maxCurrentAlongside_kn"),
                MaxWaveHeightM           = Dbl(row, "maxWaveHeight_m"),
                TideRangeMinM            = Dbl(row, "tideRangeMin_m"),
                TideRangeMaxM            = Dbl(row, "tideRangeMax_m"),
                TugRequirementsNotes     = S(row, "tugRequirementsNotes").NullIfEmpty(),

                Status                   = S(row, "status") is { Length: > 0 } st ? st : "Active",
                IsActive                 = !row.ContainsKey("isActive") || B(row, "isActive"),
                ImageUrl                 = S(row, "image_url").NullIfEmpty(),
            };

            db.Vessels.Add(entity);
            existing[publicId] = 0;
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  Vessel: {added} added.");
    }

    // -------------------------------------------------------------------------
    // Document
    // -------------------------------------------------------------------------

    private static async Task ImportDocumentsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "Document_export-2.csv");
        if (!File.Exists(file)) { Console.WriteLine($"  SKIP (not found): {file}"); return; }

        // Build vessel lookup: publicId → integer PK (needed for VesselId FK)
        var vesselIdByPublicId = db.Vessels
            .Select(v => new { v.PublicId, v.Id })
            .ToDictionary(v => v.PublicId, v => v.Id);

        var existing = db.Documents.ToDictionary(d => d.PublicId, d => d.Id);
        int added = 0;
        int skippedNoVessel = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            var vesselPublicId = S(row, "vesselPublicId").NullIfEmpty();
            int? vesselId = null;
            if (vesselPublicId is not null && vesselIdByPublicId.TryGetValue(vesselPublicId, out var vid))
                vesselId = vid;
            else if (vesselPublicId is not null)
                skippedNoVessel++;

            var entity = new Document
            {
                PublicId                = publicId,
                TenantId                = S(row, "tenantId") is { Length: > 0 } tid ? tid : "default-tenant",
                VesselId                = vesselId,
                VesselPublicId          = vesselPublicId,
                DocumentTypePublicId    = S(row, "documentTypePublicId").NullIfEmpty(),
                TerminalPublicId        = S(row, "terminalPublicId").NullIfEmpty(),
                BerthPublicId           = S(row, "berthPublicId").NullIfEmpty(),
                TerminalFormPublicId    = S(row, "terminalFormPublicId").NullIfEmpty(),
                DocumentName            = S(row, "document_name").NullIfEmpty(),
                LegacyDocumentType      = S(row, "document_type").NullIfEmpty(),
                Category                = S(row, "category").NullIfEmpty(),
                FileUrl                 = S(row, "file_url").NullIfEmpty(),
                IssueDate               = Date(row, "issue_date"),
                ExpiryDate              = Date(row, "expiry_date"),
                LegacyIssuingAuthority  = S(row, "issuing_authority").NullIfEmpty(),
                IssuingAuthorityPublicId = S(row, "issuingAuthorityPublicId").NullIfEmpty(),
                ReferenceNumber         = S(row, "reference_number").NullIfEmpty(),
                Notes                   = S(row, "notes").NullIfEmpty(),
                Status                  = S(row, "status") is { Length: > 0 } st ? st : "Valid",
                IsActive                = !row.ContainsKey("isActive") || B(row, "isActive"),
                IntendedVisitDate       = Date(row, "intendedVisitDate"),
            };

            db.Documents.Add(entity);
            existing[publicId] = 0;
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  Document: {added} added.");
        if (skippedNoVessel > 0)
            Console.WriteLine($"  Document: {skippedNoVessel} had vesselPublicId not found in Vessel table (VesselId set to null).");
    }
}
