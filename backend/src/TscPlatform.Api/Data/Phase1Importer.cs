using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using System.Text.Json;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Data;

/// <summary>
/// Imports Phase 1 reference/master data from Base44 CSV exports.
/// Safe to run multiple times — existing rows (matched by publicId) are skipped.
/// Rows where is_sample = "true" are always skipped.
/// </summary>
public static class Phase1Importer
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

        var countryIds      = await ImportCountriesAsync(db, dataDir);
        await ImportCountryAliasesAsync(db, dataDir, countryIds);
        await ImportMaritimeZonesAsync(db, dataDir);
        await ImportCountryMaritimeZonesAsync(db, dataDir);
        var productTypeIds  = await ImportProductTypeRefsAsync(db, dataDir);
        var cargoTypeIds    = await ImportCargoTypeRefsAsync(db, dataDir, productTypeIds);
        var fuelTypeIds     = await ImportFuelTypeRefsAsync(db, dataDir);
        var vesselTypeIds   = await ImportVesselTypeRefsAsync(db, dataDir);
        await ImportVesselTypeAllowedCargoTypesAsync(db, dataDir, vesselTypeIds, cargoTypeIds);
        await ImportVesselTypeAllowedFuelTypesAsync(db, dataDir, vesselTypeIds, fuelTypeIds);
        await ImportVesselTypeCargoPoliciesAsync(db, dataDir, vesselTypeIds, cargoTypeIds);
        await ImportVesselTypeFuelTankPoliciesAsync(db, dataDir, vesselTypeIds, fuelTypeIds);
        await ImportTerminalTypesAsync(db, dataDir);
        var docCatIds       = await ImportDocumentCategoriesAsync(db, dataDir);
        var docTypeIds      = await ImportDocumentTypesAsync(db, dataDir, docCatIds);
        await ImportIssuingAuthoritiesAsync(db, dataDir, countryIds);
        await ImportDocumentTypeExternalCodesAsync(db, dataDir, docTypeIds);
        await ImportSystemTagsAsync(db, dataDir);
        await ImportUdfConfigurationsAsync(db, dataDir);
        await ImportUdfListValuesAsync(db, dataDir);

        Console.WriteLine("Phase 1 import complete.");
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
        // Accept YYYY-MM-DD and YYYY
        if (DateOnly.TryParse(v, out var d)) return d;
        if (int.TryParse(v, out var y)) return new DateOnly(y, 1, 1);
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

    private static async Task<Dictionary<string, int>> BuildPublicIdMap(TscDbContext db, IQueryable<dynamic> query)
        => await Task.FromResult(new Dictionary<string, int>());

    // -------------------------------------------------------------------------
    // 1. Country
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, int>> ImportCountriesAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "Country_export-3.csv");
        var existing = db.Countries.ToDictionary(c => c.PublicId, c => c.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            var entity = new Country
            {
                PublicId  = publicId,
                TenantId  = S(row, "tenantId"),
                NameEn    = S(row, "nameEn"),
                Iso2      = S(row, "iso2"),
                Iso3      = string.IsNullOrEmpty(S(row, "iso3")) ? null : S(row, "iso3"),
                ValidFrom = Date(row, "validFrom"),
                ValidTo   = Date(row, "validTo"),
                IsActive  = B(row, "isActive"),
            };
            db.Countries.Add(entity);
            added++;
        }

        await db.SaveChangesAsync();
        var map = db.Countries.ToDictionary(c => c.PublicId, c => c.Id);
        Console.WriteLine($"  Country: {added} added, {map.Count} total");
        return map;
    }

    // -------------------------------------------------------------------------
    // 2. CountryAlias
    // -------------------------------------------------------------------------

    private static async Task ImportCountryAliasesAsync(TscDbContext db, string dir, Dictionary<string, int> countryIds)
    {
        var file = CsvPath(dir, "CountryAlias_export.csv");
        var existing = db.CountryAliases.Select(a => a.PublicId).ToHashSet();
        int added = 0, skipped = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            var countryPublicId = S(row, "countryPublicId");
            if (!countryIds.TryGetValue(countryPublicId, out var countryId))
            {
                skipped++;
                continue;
            }

            db.CountryAliases.Add(new CountryAlias
            {
                PublicId        = publicId,
                TenantId        = S(row, "tenantId"),
                CountryId       = countryId,
                CountryPublicId = countryPublicId,
                Alias           = S(row, "alias"),
                IsActive        = B(row, "isActive"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  CountryAlias: {added} added, {skipped} skipped (missing country)");
    }

    // -------------------------------------------------------------------------
    // 3. MaritimeZone
    // -------------------------------------------------------------------------

    private static async Task ImportMaritimeZonesAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "MaritimeZone_export-2.csv");
        var existing = db.MaritimeZones.Select(z => z.PublicId).ToHashSet();
        var seen = new HashSet<string>(); // guard against duplicates within the CSV itself
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId) || !seen.Add(publicId)) continue;

            db.MaritimeZones.Add(new MaritimeZone
            {
                PublicId      = publicId,
                TenantId      = S(row, "tenantId"),
                Code          = S(row, "code"),
                Name          = S(row, "name"),
                ZoneType      = S(row, "zoneType"),
                Authority     = string.IsNullOrEmpty(S(row, "authority")) ? null : S(row, "authority"),
                EffectiveFrom = Date(row, "effectiveFrom"),
                EffectiveTo   = Date(row, "effectiveTo"),
                Status        = string.IsNullOrEmpty(S(row, "status")) ? "Active" : S(row, "status"),
                IsActive      = B(row, "isActive"),
                DisplayOrder  = I(row, "displayOrder"),
                Color         = string.IsNullOrEmpty(S(row, "color")) ? null : S(row, "color"),
                FillOpacity   = Dbl(row, "fillOpacity"),
                StrokeOpacity = Dbl(row, "strokeOpacity"),
                StrokeWeight  = Dbl(row, "strokeWeight"),
                GeometryType  = string.IsNullOrEmpty(S(row, "geometryType")) ? null : S(row, "geometryType"),
                GeoJson       = string.IsNullOrEmpty(S(row, "geoJson")) ? null : S(row, "geoJson"),
                Notes         = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  MaritimeZone: {added} added");
    }

    // -------------------------------------------------------------------------
    // 4. CountryMaritimeZone
    // -------------------------------------------------------------------------

    private static async Task ImportCountryMaritimeZonesAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "CountryMaritimeZone_export.csv");
        var existing = db.CountryMaritimeZones.Select(z => z.PublicId).ToHashSet();
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            db.CountryMaritimeZones.Add(new CountryMaritimeZone
            {
                PublicId      = publicId,
                TenantId      = S(row, "tenantId"),
                CountryIso2   = S(row, "countryIso2"),
                ZonePublicId  = S(row, "zonePublicId"),
                Scope         = string.IsNullOrEmpty(S(row, "scope")) ? null : S(row, "scope"),
                EffectiveFrom = Date(row, "effectiveFrom"),
                EffectiveTo   = Date(row, "effectiveTo"),
                Notes         = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  CountryMaritimeZone: {added} added");
    }

    // -------------------------------------------------------------------------
    // 5. ProductTypeRef
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, int>> ImportProductTypeRefsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "ProductTypeRef_export-2.csv");
        var existing = db.ProductTypeRefs.ToDictionary(p => p.PublicId, p => p.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            db.ProductTypeRefs.Add(new ProductTypeRef
            {
                PublicId        = publicId,
                TenantId        = S(row, "tenantId"),
                Code            = S(row, "code"),
                Name            = S(row, "name"),
                ProductCategory = S(row, "productCategory"),
                IsCryogenic     = B(row, "isCryogenic"),
                IsActive        = B(row, "isActive"),
                SortOrder       = I(row, "sortOrder"),
                Notes           = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        var map = db.ProductTypeRefs.ToDictionary(p => p.PublicId, p => p.Id);
        Console.WriteLine($"  ProductTypeRef: {added} added, {map.Count} total");
        return map;
    }

    // -------------------------------------------------------------------------
    // 6. CargoTypeRef
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, int>> ImportCargoTypeRefsAsync(
        TscDbContext db, string dir, Dictionary<string, int> productTypeIds)
    {
        var file = CsvPath(dir, "CargoTypeRef_export-2.csv");
        var existing = db.CargoTypeRefs.ToDictionary(c => c.PublicId, c => c.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            var ptPublicId = S(row, "productTypePublicId");
            productTypeIds.TryGetValue(ptPublicId, out var ptId);

            db.CargoTypeRefs.Add(new CargoTypeRef
            {
                PublicId            = publicId,
                TenantId            = S(row, "tenantId"),
                Code                = S(row, "code"),
                Name                = S(row, "name"),
                CargoCategory       = S(row, "cargoCategory"),
                DefaultUnit         = S(row, "defaultUnit"),
                ProductTypeId       = string.IsNullOrEmpty(ptPublicId) ? null : ptId == 0 ? null : ptId,
                ProductTypePublicId = string.IsNullOrEmpty(ptPublicId) ? null : ptPublicId,
                IsActive            = B(row, "isActive"),
                SortOrder           = I(row, "sortOrder"),
                Notes               = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        var map = db.CargoTypeRefs.ToDictionary(c => c.PublicId, c => c.Id);
        Console.WriteLine($"  CargoTypeRef: {added} added, {map.Count} total");
        return map;
    }

    // -------------------------------------------------------------------------
    // 7. FuelTypeRef
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, int>> ImportFuelTypeRefsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "FuelTypeRef_export.csv");
        var existing = db.FuelTypeRefs.ToDictionary(f => f.PublicId, f => f.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            db.FuelTypeRefs.Add(new FuelTypeRef
            {
                PublicId        = publicId,
                TenantId        = S(row, "tenantId"),
                Code            = S(row, "code"),
                Name            = S(row, "name"),
                Category        = string.IsNullOrEmpty(S(row, "category")) ? null : S(row, "category"),
                HeatingRequired = B(row, "heatingRequired"),
                IsCryogenic     = B(row, "isCryogenic"),
                IsActive        = B(row, "isActive"),
                SortOrder       = I(row, "sortOrder"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        var map = db.FuelTypeRefs.ToDictionary(f => f.PublicId, f => f.Id);
        Console.WriteLine($"  FuelTypeRef: {added} added, {map.Count} total");
        return map;
    }

    // -------------------------------------------------------------------------
    // 8. VesselTypeRef
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, int>> ImportVesselTypeRefsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "VesselTypeRef_export-2.csv");
        var existing = db.VesselTypeRefs.ToDictionary(v => v.PublicId, v => v.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            db.VesselTypeRefs.Add(new VesselTypeRef
            {
                PublicId                = publicId,
                TenantId                = S(row, "tenantId"),
                PrimaryType             = S(row, "primaryType"),
                SubType                 = S(row, "subType"),
                SizeMetric              = string.IsNullOrEmpty(S(row, "sizeMetric")) ? null : S(row, "sizeMetric"),
                TypicalSizeRange        = string.IsNullOrEmpty(S(row, "typicalSizeRange")) ? null : S(row, "typicalSizeRange"),
                DefiningCharacteristics = string.IsNullOrEmpty(S(row, "definingCharacteristics")) ? null : S(row, "definingCharacteristics"),
                CapabilitiesSections    = string.IsNullOrEmpty(S(row, "capabilitiesSections")) ? null : S(row, "capabilitiesSections"),
                SortOrder               = I(row, "sortOrder"),
                IsActive                = B(row, "isActive"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        var map = db.VesselTypeRefs.ToDictionary(v => v.PublicId, v => v.Id);
        Console.WriteLine($"  VesselTypeRef: {added} added, {map.Count} total");
        return map;
    }

    // -------------------------------------------------------------------------
    // 9. VesselTypeAllowedCargoType
    // -------------------------------------------------------------------------

    private static async Task ImportVesselTypeAllowedCargoTypesAsync(
        TscDbContext db, string dir,
        Dictionary<string, int> vesselTypeIds, Dictionary<string, int> cargoTypeIds)
    {
        var file = CsvPath(dir, "VesselTypeAllowedCargoType_export.csv");
        var existing = db.VesselTypeAllowedCargoTypes.Select(x => x.PublicId).ToHashSet();
        int added = 0, skipped = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            var vtPub = S(row, "vesselTypeRefPublicId");
            var ctPub = S(row, "cargoTypeRefPublicId");
            if (!vesselTypeIds.TryGetValue(vtPub, out var vtId) || !cargoTypeIds.TryGetValue(ctPub, out var ctId))
            {
                skipped++;
                continue;
            }

            db.VesselTypeAllowedCargoTypes.Add(new VesselTypeAllowedCargoType
            {
                PublicId             = publicId,
                TenantId             = S(row, "tenantId"),
                VesselTypeRefId      = vtId,
                VesselTypeRefPublicId = vtPub,
                CargoTypeRefId       = ctId,
                CargoTypeRefPublicId = ctPub,
                IsAllowed            = B(row, "isAllowed"),
                IsActive             = B(row, "isActive"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  VesselTypeAllowedCargoType: {added} added, {skipped} skipped");
    }

    // -------------------------------------------------------------------------
    // 10. VesselTypeAllowedFuelType
    // -------------------------------------------------------------------------

    private static async Task ImportVesselTypeAllowedFuelTypesAsync(
        TscDbContext db, string dir,
        Dictionary<string, int> vesselTypeIds, Dictionary<string, int> fuelTypeIds)
    {
        var file = CsvPath(dir, "VesselTypeAllowedFuelType_export.csv");
        var existing = db.VesselTypeAllowedFuelTypes.Select(x => x.PublicId).ToHashSet();
        int added = 0, skipped = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            var vtPub = S(row, "vesselTypeRefPublicId");
            var ftPub = S(row, "fuelTypeRefPublicId");
            if (!vesselTypeIds.TryGetValue(vtPub, out var vtId) || !fuelTypeIds.TryGetValue(ftPub, out var ftId))
            {
                skipped++;
                continue;
            }

            db.VesselTypeAllowedFuelTypes.Add(new VesselTypeAllowedFuelType
            {
                PublicId              = publicId,
                TenantId              = S(row, "tenantId"),
                VesselTypeRefId       = vtId,
                VesselTypeRefPublicId = vtPub,
                FuelTypeRefId         = ftId,
                FuelTypeRefPublicId   = ftPub,
                IsAllowed             = B(row, "isAllowed"),
                IsActive              = B(row, "isActive"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  VesselTypeAllowedFuelType: {added} added, {skipped} skipped");
    }

    // -------------------------------------------------------------------------
    // 11. VesselTypeCargoPolicy
    // -------------------------------------------------------------------------

    private static async Task ImportVesselTypeCargoPoliciesAsync(
        TscDbContext db, string dir,
        Dictionary<string, int> vesselTypeIds, Dictionary<string, int> cargoTypeIds)
    {
        var file = CsvPath(dir, "VesselTypeCargoPolicy_export.csv");
        var existing = db.VesselTypeCargoPolicies.Select(x => x.PublicId).ToHashSet();
        int added = 0, skipped = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            var vtPub = S(row, "vesselTypeRefPublicId");
            var ctPub = S(row, "cargoTypeRefPublicId");
            if (!vesselTypeIds.TryGetValue(vtPub, out var vtId) || !cargoTypeIds.TryGetValue(ctPub, out var ctId))
            {
                skipped++;
                continue;
            }

            var capVal = S(row, "defaultCapacityValue");
            decimal? capDecimal = decimal.TryParse(capVal, NumberStyles.Any, CultureInfo.InvariantCulture, out var cd) ? cd : null;

            db.VesselTypeCargoPolicies.Add(new VesselTypeCargoPolicy
            {
                PublicId              = publicId,
                TenantId              = S(row, "tenantId"),
                VesselTypeRefId       = vtId,
                VesselTypeRefPublicId = vtPub,
                CargoTypeRefId        = ctId,
                CargoTypeRefPublicId  = ctPub,
                IsAllowed             = B(row, "isAllowed"),
                IsDefault             = B(row, "isDefault"),
                DefaultCapacityValue  = capDecimal,
                DefaultCapacityUnit   = string.IsNullOrEmpty(S(row, "defaultCapacityUnit")) ? null : S(row, "defaultCapacityUnit"),
                CapacityBasis         = string.IsNullOrEmpty(S(row, "capacityBasis")) ? null : S(row, "capacityBasis"),
                Notes                 = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
                IsActive              = B(row, "isActive"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  VesselTypeCargoPolicy: {added} added, {skipped} skipped");
    }

    // -------------------------------------------------------------------------
    // 12. VesselTypeFuelTankPolicy
    // -------------------------------------------------------------------------

    private static async Task ImportVesselTypeFuelTankPoliciesAsync(
        TscDbContext db, string dir,
        Dictionary<string, int> vesselTypeIds, Dictionary<string, int> fuelTypeIds)
    {
        var file = CsvPath(dir, "VesselTypeFuelTankPolicy_export.csv");
        var existing = db.VesselTypeFuelTankPolicies.Select(x => x.PublicId).ToHashSet();
        int added = 0, skipped = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            var vtPub = S(row, "vesselTypeRefPublicId");
            var ftPub = S(row, "fuelTypeRefPublicId");
            if (!vesselTypeIds.TryGetValue(vtPub, out var vtId) || !fuelTypeIds.TryGetValue(ftPub, out var ftId))
            {
                skipped++;
                continue;
            }

            db.VesselTypeFuelTankPolicies.Add(new VesselTypeFuelTankPolicy
            {
                PublicId              = publicId,
                TenantId              = S(row, "tenantId"),
                VesselTypeRefId       = vtId,
                VesselTypeRefPublicId = vtPub,
                FuelTypeRefId         = ftId,
                FuelTypeRefPublicId   = ftPub,
                TankRole              = S(row, "tankRole"),
                IsAllowed             = B(row, "isAllowed"),
                IsDefault             = B(row, "isDefault"),
                MinCount              = I(row, "minCount"),
                RecommendedCount      = I(row, "recommendedCount"),
                Notes                 = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
                IsActive              = B(row, "isActive"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  VesselTypeFuelTankPolicy: {added} added, {skipped} skipped");
    }

    // -------------------------------------------------------------------------
    // 13. TerminalType
    // -------------------------------------------------------------------------

    private static async Task ImportTerminalTypesAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "TerminalType_export.csv");
        var existing = db.TerminalTypes.Select(t => t.PublicId).ToHashSet();
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            db.TerminalTypes.Add(new TerminalType
            {
                PublicId    = publicId,
                TenantId    = S(row, "tenantId"),
                Name        = S(row, "name"),
                Description = string.IsNullOrEmpty(S(row, "description")) ? null : S(row, "description"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  TerminalType: {added} added");
    }

    // -------------------------------------------------------------------------
    // 14. DocumentCategory
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, int>> ImportDocumentCategoriesAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "DocumentCategory_export.csv");
        var existing = db.DocumentCategories.ToDictionary(c => c.PublicId, c => c.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            db.DocumentCategories.Add(new DocumentCategory
            {
                PublicId    = publicId,
                TenantId    = S(row, "tenantId"),
                Name        = S(row, "name"),
                Description = string.IsNullOrEmpty(S(row, "description")) ? null : S(row, "description"),
                IsActive    = B(row, "isActive"),
                SortOrder   = I(row, "sortOrder"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        var map = db.DocumentCategories.ToDictionary(c => c.PublicId, c => c.Id);
        Console.WriteLine($"  DocumentCategory: {added} added, {map.Count} total");
        return map;
    }

    // -------------------------------------------------------------------------
    // 15. DocumentType
    // -------------------------------------------------------------------------

    private static async Task<Dictionary<string, int>> ImportDocumentTypesAsync(
        TscDbContext db, string dir, Dictionary<string, int> docCatIds)
    {
        var file = CsvPath(dir, "DocumentType_export-2.csv");
        var existing = db.DocumentTypes.ToDictionary(d => d.PublicId, d => d.Id);
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.ContainsKey(publicId)) continue;

            var catPub = S(row, "categoryPublicId");
            docCatIds.TryGetValue(catPub, out var catId);

            db.DocumentTypes.Add(new DocumentType
            {
                PublicId                 = publicId,
                TenantId                 = S(row, "tenantId"),
                Name                     = S(row, "name"),
                Code                     = string.IsNullOrEmpty(S(row, "code")) ? null : S(row, "code"),
                SearchAliases            = ParseJsonStringArray(row, "searchAliases"),
                CategoryId               = string.IsNullOrEmpty(catPub) ? null : catId == 0 ? null : catId,
                CategoryPublicId         = string.IsNullOrEmpty(catPub) ? null : catPub,
                AppliesTo                = string.IsNullOrEmpty(S(row, "appliesTo")) ? null : S(row, "appliesTo"),
                DocumentValidityType     = string.IsNullOrEmpty(S(row, "documentValidityType")) ? null : S(row, "documentValidityType"),
                IsExpiryRequired         = B(row, "isExpiryRequired"),
                DefaultValidityDuration  = I(row, "defaultValidityDuration"),
                ValidityUnit             = string.IsNullOrEmpty(S(row, "validityUnit")) ? null : S(row, "validityUnit"),
                ReminderLeadTime         = I(row, "reminderLeadTime"),
                ReminderUnit             = string.IsNullOrEmpty(S(row, "reminderUnit")) ? null : S(row, "reminderUnit"),
                IssuingAuthorityDefault  = string.IsNullOrEmpty(S(row, "issuingAuthorityDefault")) ? null : S(row, "issuingAuthorityDefault"),
                AllowedIssuers           = ParseJsonStringArray(row, "allowedIssuers"),
                IsActive                 = B(row, "isActive"),
                SortOrder                = I(row, "sortOrder"),
                Description              = string.IsNullOrEmpty(S(row, "description")) ? null : S(row, "description"),
                Notes                    = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        var map = db.DocumentTypes.ToDictionary(d => d.PublicId, d => d.Id);
        Console.WriteLine($"  DocumentType: {added} added, {map.Count} total");
        return map;
    }

    // -------------------------------------------------------------------------
    // 16. IssuingAuthority
    // -------------------------------------------------------------------------

    private static async Task ImportIssuingAuthoritiesAsync(
        TscDbContext db, string dir, Dictionary<string, int> countryIds)
    {
        var file = CsvPath(dir, "IssuingAuthority_export.csv");
        var existing = db.IssuingAuthorities.Select(a => a.PublicId).ToHashSet();
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            var cPub = S(row, "countryPublicId");
            countryIds.TryGetValue(cPub, out var cId);

            db.IssuingAuthorities.Add(new IssuingAuthority
            {
                PublicId        = publicId,
                TenantId        = S(row, "tenantId"),
                Name            = S(row, "name"),
                AuthorityType   = S(row, "authority_type"),
                CountryId       = string.IsNullOrEmpty(cPub) ? null : cId == 0 ? null : cId,
                CountryPublicId = string.IsNullOrEmpty(cPub) ? null : cPub,
                CompanyId       = string.IsNullOrEmpty(S(row, "companyId")) ? null : S(row, "companyId"),
                CompanyPublicId = string.IsNullOrEmpty(S(row, "companyPublicId")) ? null : S(row, "companyPublicId"),
                ContactEmail    = string.IsNullOrEmpty(S(row, "contact_email")) ? null : S(row, "contact_email"),
                Website         = string.IsNullOrEmpty(S(row, "website")) ? null : S(row, "website"),
                Notes           = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  IssuingAuthority: {added} added");
    }

    // -------------------------------------------------------------------------
    // 17. DocumentTypeExternalCode
    // -------------------------------------------------------------------------

    private static async Task ImportDocumentTypeExternalCodesAsync(
        TscDbContext db, string dir, Dictionary<string, int> docTypeIds)
    {
        var file = CsvPath(dir, "DocumentTypeExternalCode_export.csv");
        var existing = db.DocumentTypeExternalCodes.Select(e => e.PublicId).ToHashSet();
        int added = 0, skipped = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            var dtPub = S(row, "documentTypePublicId");
            if (!docTypeIds.TryGetValue(dtPub, out var dtId))
            {
                skipped++;
                Console.WriteLine($"    Skipping DocumentTypeExternalCode {publicId}: documentType {dtPub} not found");
                continue;
            }

            db.DocumentTypeExternalCodes.Add(new DocumentTypeExternalCode
            {
                PublicId               = publicId,
                TenantId               = S(row, "tenantId"),
                DocumentTypeId         = dtId,
                DocumentTypePublicId   = dtPub,
                AuthorityCompanyId     = string.IsNullOrEmpty(S(row, "authorityCompanyId")) ? null : S(row, "authorityCompanyId"),
                AuthorityCompanyPublicId = string.IsNullOrEmpty(S(row, "authorityCompanyPublicId")) ? null : S(row, "authorityCompanyPublicId"),
                ExternalCode           = S(row, "externalCode"),
                ExternalName           = string.IsNullOrEmpty(S(row, "externalName")) ? null : S(row, "externalName"),
                CodeType               = S(row, "codeType"),
                Notes                  = string.IsNullOrEmpty(S(row, "notes")) ? null : S(row, "notes"),
                IsPrimary              = B(row, "isPrimary"),
                IsActive               = B(row, "isActive"),
                SortOrder              = I(row, "sortOrder"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  DocumentTypeExternalCode: {added} added, {skipped} skipped (orphaned documentType ref)");
    }

    // -------------------------------------------------------------------------
    // 18. SystemTag
    // -------------------------------------------------------------------------

    private static async Task ImportSystemTagsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "SystemTag_export.csv");
        var existing = db.SystemTags.Select(t => t.PublicId).ToHashSet();
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            db.SystemTags.Add(new SystemTag
            {
                PublicId  = publicId,
                TenantId  = S(row, "tenantId"),
                Name      = S(row, "name"),
                Code      = S(row, "code"),
                Category  = string.IsNullOrEmpty(S(row, "category")) ? null : S(row, "category"),
                AppliesTo = ParseJsonStringArray(row, "appliesTo"),
                IsSystem  = B(row, "isSystem"),
                IsLocked  = B(row, "isLocked"),
                IsActive  = B(row, "isActive"),
                SortOrder = I(row, "sortOrder"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  SystemTag: {added} added");
    }

    // -------------------------------------------------------------------------
    // 19. UdfConfiguration
    // -------------------------------------------------------------------------

    private static async Task ImportUdfConfigurationsAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "UdfConfiguration_export.csv");
        var existing = db.UdfConfigurations.Select(u => u.PublicId).ToHashSet();
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            db.UdfConfigurations.Add(new UdfConfiguration
            {
                PublicId        = publicId,
                TenantId        = S(row, "tenantId"),
                Module          = S(row, "module"),
                UdfCode         = S(row, "udfCode"),
                Label           = string.IsNullOrEmpty(S(row, "label")) ? null : S(row, "label"),
                IncludeInSearch = B(row, "includeInSearch"),
                CreateList      = B(row, "createList"),
                FieldType       = string.IsNullOrEmpty(S(row, "fieldType")) ? "Text" : S(row, "fieldType"),
                MaxLength       = I(row, "maxLength") ?? 255,
                SortOrder       = I(row, "sortOrder"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  UdfConfiguration: {added} added");
    }

    // -------------------------------------------------------------------------
    // 20. UdfListValue
    // -------------------------------------------------------------------------

    private static async Task ImportUdfListValuesAsync(TscDbContext db, string dir)
    {
        var file = CsvPath(dir, "UdfListValue_export.csv");
        var existing = db.UdfListValues.Select(u => u.PublicId).ToHashSet();
        int added = 0;

        foreach (var row in ReadCsv(file))
        {
            if (IsSample(row)) continue;
            var publicId = S(row, "publicId");
            if (string.IsNullOrEmpty(publicId) || existing.Contains(publicId)) continue;

            db.UdfListValues.Add(new UdfListValue
            {
                PublicId  = publicId,
                TenantId  = S(row, "tenantId"),
                Module    = S(row, "module"),
                UdfCode   = S(row, "udfCode"),
                Value     = S(row, "value"),
                SortOrder = I(row, "sortOrder"),
                IsActive  = B(row, "isActive"),
            });
            added++;
        }

        await db.SaveChangesAsync();
        Console.WriteLine($"  UdfListValue: {added} added");
    }
}
