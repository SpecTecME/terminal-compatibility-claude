using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(TscDbContext db)
    {
        await SeedCountriesAsync(db);
    }

    private static async Task SeedCountriesAsync(TscDbContext db)
    {
        var countries = new[]
        {
            new Country { PublicId = "a1b2c3d4-0001-0001-0001-000000000001", TenantId = "system", Iso2 = "AE", Iso3 = "ARE", NameEn = "United Arab Emirates", IsActive = true },
            new Country { PublicId = "a1b2c3d4-0001-0001-0001-000000000002", TenantId = "system", Iso2 = "QA", Iso3 = "QAT", NameEn = "Qatar",                  IsActive = true },
            new Country { PublicId = "a1b2c3d4-0001-0001-0001-000000000003", TenantId = "system", Iso2 = "SA", Iso3 = "SAU", NameEn = "Saudi Arabia",            IsActive = true },
            new Country { PublicId = "a1b2c3d4-0001-0001-0001-000000000004", TenantId = "system", Iso2 = "OM", Iso3 = "OMN", NameEn = "Oman",                    IsActive = true },
            new Country { PublicId = "a1b2c3d4-0001-0001-0001-000000000005", TenantId = "system", Iso2 = "KW", Iso3 = "KWT", NameEn = "Kuwait",                  IsActive = true },
            new Country { PublicId = "a1b2c3d4-0001-0001-0001-000000000006", TenantId = "system", Iso2 = "BH", Iso3 = "BHR", NameEn = "Bahrain",                 IsActive = true },
        };

        foreach (var country in countries)
        {
            if (!db.Countries.Any(c => c.Iso2 == country.Iso2))
            {
                db.Countries.Add(country);
            }
        }

        await db.SaveChangesAsync();
    }
}
