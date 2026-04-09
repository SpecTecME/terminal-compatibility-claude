using Microsoft.EntityFrameworkCore;
using TscPlatform.Api.Models.Audit;
using TscPlatform.Api.Models.Phase1;

namespace TscPlatform.Api.Data;

public class TscDbContext : DbContext
{
    public TscDbContext(DbContextOptions<TscDbContext> options) : base(options) { }

    // Phase 1 — Geography
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<CountryAlias> CountryAliases => Set<CountryAlias>();
    public DbSet<MaritimeZone> MaritimeZones => Set<MaritimeZone>();
    public DbSet<CountryMaritimeZone> CountryMaritimeZones => Set<CountryMaritimeZone>();

    // Phase 1 — Cargo / Fuel / Product
    public DbSet<ProductTypeRef> ProductTypeRefs => Set<ProductTypeRef>();
    public DbSet<CargoTypeRef> CargoTypeRefs => Set<CargoTypeRef>();
    public DbSet<FuelTypeRef> FuelTypeRefs => Set<FuelTypeRef>();

    // Phase 1 — Vessel type policies
    public DbSet<VesselTypeRef> VesselTypeRefs => Set<VesselTypeRef>();
    public DbSet<VesselTypeAllowedCargoType> VesselTypeAllowedCargoTypes => Set<VesselTypeAllowedCargoType>();
    public DbSet<VesselTypeAllowedFuelType> VesselTypeAllowedFuelTypes => Set<VesselTypeAllowedFuelType>();
    public DbSet<VesselTypeCargoPolicy> VesselTypeCargoPolicies => Set<VesselTypeCargoPolicy>();
    public DbSet<VesselTypeFuelTankPolicy> VesselTypeFuelTankPolicies => Set<VesselTypeFuelTankPolicy>();

    // Phase 1 — Terminal
    public DbSet<TerminalType> TerminalTypes => Set<TerminalType>();

    // Phase 1 — Documents
    public DbSet<DocumentCategory> DocumentCategories => Set<DocumentCategory>();
    public DbSet<DocumentType> DocumentTypes => Set<DocumentType>();
    public DbSet<DocumentTypeExternalCode> DocumentTypeExternalCodes => Set<DocumentTypeExternalCode>();
    public DbSet<IssuingAuthority> IssuingAuthorities => Set<IssuingAuthority>();

    // Phase 1 — System config
    public DbSet<SystemTag> SystemTags => Set<SystemTag>();
    public DbSet<MapConfiguration> MapConfigurations => Set<MapConfiguration>();
    public DbSet<UdfConfiguration> UdfConfigurations => Set<UdfConfiguration>();
    public DbSet<UdfListValue> UdfListValues => Set<UdfListValue>();

    // Audit
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<SystemAuditLog> SystemAuditLogs => Set<SystemAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Indexes on tenantId for every BaseEntity table
        modelBuilder.Entity<Country>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<Country>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<CountryAlias>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<CountryAlias>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<MaritimeZone>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<MaritimeZone>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<CountryMaritimeZone>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<CountryMaritimeZone>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<ProductTypeRef>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<ProductTypeRef>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<CargoTypeRef>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<CargoTypeRef>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<FuelTypeRef>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<FuelTypeRef>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<VesselTypeRef>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<VesselTypeRef>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<VesselTypeAllowedCargoType>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<VesselTypeAllowedCargoType>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<VesselTypeAllowedFuelType>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<VesselTypeAllowedFuelType>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<VesselTypeCargoPolicy>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<VesselTypeCargoPolicy>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<VesselTypeFuelTankPolicy>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<VesselTypeFuelTankPolicy>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<TerminalType>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<TerminalType>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<DocumentCategory>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<DocumentCategory>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<DocumentType>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<DocumentType>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<DocumentTypeExternalCode>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<DocumentTypeExternalCode>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<IssuingAuthority>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<IssuingAuthority>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<SystemTag>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<SystemTag>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<MapConfiguration>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<MapConfiguration>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<UdfConfiguration>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<UdfConfiguration>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<UdfListValue>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<UdfListValue>().HasIndex(e => e.PublicId).IsUnique();

        modelBuilder.Entity<AuditLog>().HasIndex(e => e.TenantId);
        modelBuilder.Entity<AuditLog>().HasIndex(e => e.PublicId).IsUnique();

        // PostgreSQL array columns
        modelBuilder.Entity<DocumentType>()
            .Property(e => e.SearchAliases)
            .HasColumnType("text[]");

        modelBuilder.Entity<DocumentType>()
            .Property(e => e.AllowedIssuers)
            .HasColumnType("text[]");

        modelBuilder.Entity<SystemTag>()
            .Property(e => e.AppliesTo)
            .HasColumnType("text[]");
    }
}
