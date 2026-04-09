using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TscPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialPhase1Create : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLog",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tableName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    recordId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    recordPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    action = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    fieldName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    previousValue = table.Column<string>(type: "text", nullable: true),
                    newValue = table.Column<string>(type: "text", nullable: true),
                    userId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    userEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    userName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ipAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    userAgent = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_AuditLog", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Country",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    iso2 = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    iso3 = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    nameEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    validFrom = table.Column<DateOnly>(type: "date", nullable: true),
                    validTo = table.Column<DateOnly>(type: "date", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Country", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CountryMaritimeZone",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    countryIso2 = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    zonePublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    scope = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    effectiveFrom = table.Column<DateOnly>(type: "date", nullable: true),
                    effectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_CountryMaritimeZone", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "DocumentCategory",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_DocumentCategory", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "FuelTypeRef",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    heatingRequired = table.Column<bool>(type: "boolean", nullable: false),
                    isCryogenic = table.Column<bool>(type: "boolean", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_FuelTypeRef", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "MapConfiguration",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mapMode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    pmtilesUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    externalTileUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    useMaritimeZones = table.Column<bool>(type: "boolean", nullable: false),
                    enableExternalGeocoding = table.Column<bool>(type: "boolean", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_MapConfiguration", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "MaritimeZone",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    zoneType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    authority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    effectiveFrom = table.Column<DateOnly>(type: "date", nullable: true),
                    effectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    displayOrder = table.Column<int>(type: "integer", nullable: true),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: true),
                    fillOpacity = table.Column<double>(type: "double precision", nullable: true),
                    strokeOpacity = table.Column<double>(type: "double precision", nullable: true),
                    strokeWeight = table.Column<double>(type: "double precision", nullable: true),
                    geometryType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    geoJson = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_MaritimeZone", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "ProductTypeRef",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    productCategory = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    isCryogenic = table.Column<bool>(type: "boolean", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_ProductTypeRef", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "SystemAuditLog",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    module_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    record_id = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    action_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    old_value_json = table.Column<string>(type: "text", nullable: true),
                    new_value_json = table.Column<string>(type: "text", nullable: true),
                    changed_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    changed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_SystemAuditLog", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "SystemTag",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    appliesTo = table.Column<string[]>(type: "text[]", nullable: false),
                    isSystem = table.Column<bool>(type: "boolean", nullable: false),
                    isLocked = table.Column<bool>(type: "boolean", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_SystemTag", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "TerminalType",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_TerminalType", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "UdfConfiguration",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    module = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    udfCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    includeInSearch = table.Column<bool>(type: "boolean", nullable: false),
                    createList = table.Column<bool>(type: "boolean", nullable: false),
                    fieldType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    maxLength = table.Column<int>(type: "integer", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_UdfConfiguration", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "VesselTypeRef",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    primaryType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    subType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sizeMetric = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    typicalSizeRange = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    definingCharacteristics = table.Column<string>(type: "text", nullable: true),
                    capabilitiesSections = table.Column<string>(type: "text", nullable: true),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_VesselTypeRef", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "CountryAlias",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    countryId = table.Column<int>(type: "integer", nullable: false),
                    countryPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    alias = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_CountryAlias", x => x.id);
                    table.ForeignKey(
                        name: "fK_CountryAlias_Country_countryId",
                        column: x => x.countryId,
                        principalTable: "Country",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "IssuingAuthority",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    authority_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    countryId = table.Column<int>(type: "integer", nullable: true),
                    countryPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    companyId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    companyPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    contact_email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_IssuingAuthority", x => x.id);
                    table.ForeignKey(
                        name: "fK_IssuingAuthority_Country_countryId",
                        column: x => x.countryId,
                        principalTable: "Country",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "DocumentType",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    searchAliases = table.Column<string[]>(type: "text[]", nullable: false),
                    categoryId = table.Column<int>(type: "integer", nullable: true),
                    categoryPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    appliesTo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    documentValidityType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    isExpiryRequired = table.Column<bool>(type: "boolean", nullable: false),
                    defaultValidityDuration = table.Column<int>(type: "integer", nullable: true),
                    validityUnit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    reminderLeadTime = table.Column<int>(type: "integer", nullable: true),
                    reminderUnit = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    issuingAuthorityDefault = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    allowedIssuers = table.Column<string[]>(type: "text[]", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_DocumentType", x => x.id);
                    table.ForeignKey(
                        name: "fK_DocumentType_DocumentCategory_categoryId",
                        column: x => x.categoryId,
                        principalTable: "DocumentCategory",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "CargoTypeRef",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    cargoCategory = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    defaultUnit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    productTypeId = table.Column<int>(type: "integer", nullable: true),
                    productTypePublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_CargoTypeRef", x => x.id);
                    table.ForeignKey(
                        name: "fK_CargoTypeRef_ProductTypeRef_productTypeId",
                        column: x => x.productTypeId,
                        principalTable: "ProductTypeRef",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "UdfListValue",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    module = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    udfCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    value = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    udfConfigurationId = table.Column<int>(type: "integer", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_UdfListValue", x => x.id);
                    table.ForeignKey(
                        name: "fK_UdfListValue_UdfConfiguration_udfConfigurationId",
                        column: x => x.udfConfigurationId,
                        principalTable: "UdfConfiguration",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "VesselTypeAllowedFuelType",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vesselTypeRefId = table.Column<int>(type: "integer", nullable: false),
                    vesselTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    fuelTypeRefId = table.Column<int>(type: "integer", nullable: false),
                    fuelTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    isAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_VesselTypeAllowedFuelType", x => x.id);
                    table.ForeignKey(
                        name: "fK_VesselTypeAllowedFuelType_FuelTypeRef_fuelTypeRefId",
                        column: x => x.fuelTypeRefId,
                        principalTable: "FuelTypeRef",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fK_VesselTypeAllowedFuelType_VesselTypeRef_vesselTypeRefId",
                        column: x => x.vesselTypeRefId,
                        principalTable: "VesselTypeRef",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VesselTypeFuelTankPolicy",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vesselTypeRefId = table.Column<int>(type: "integer", nullable: false),
                    vesselTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    fuelTypeRefId = table.Column<int>(type: "integer", nullable: false),
                    fuelTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tankRole = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    isAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    isDefault = table.Column<bool>(type: "boolean", nullable: false),
                    minCount = table.Column<int>(type: "integer", nullable: true),
                    recommendedCount = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_VesselTypeFuelTankPolicy", x => x.id);
                    table.ForeignKey(
                        name: "fK_VesselTypeFuelTankPolicy_FuelTypeRef_fuelTypeRefId",
                        column: x => x.fuelTypeRefId,
                        principalTable: "FuelTypeRef",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fK_VesselTypeFuelTankPolicy_VesselTypeRef_vesselTypeRefId",
                        column: x => x.vesselTypeRefId,
                        principalTable: "VesselTypeRef",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DocumentTypeExternalCode",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    documentTypeId = table.Column<int>(type: "integer", nullable: false),
                    documentTypePublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    authorityCompanyId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    authorityCompanyPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    externalCode = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    externalName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    codeType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    isPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_DocumentTypeExternalCode", x => x.id);
                    table.ForeignKey(
                        name: "fK_DocumentTypeExternalCode_DocumentType_documentTypeId",
                        column: x => x.documentTypeId,
                        principalTable: "DocumentType",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VesselTypeAllowedCargoType",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vesselTypeRefId = table.Column<int>(type: "integer", nullable: false),
                    vesselTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    cargoTypeRefId = table.Column<int>(type: "integer", nullable: false),
                    cargoTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    isAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_VesselTypeAllowedCargoType", x => x.id);
                    table.ForeignKey(
                        name: "fK_VesselTypeAllowedCargoType_CargoTypeRef_cargoTypeRefId",
                        column: x => x.cargoTypeRefId,
                        principalTable: "CargoTypeRef",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fK_VesselTypeAllowedCargoType_VesselTypeRef_vesselTypeRefId",
                        column: x => x.vesselTypeRefId,
                        principalTable: "VesselTypeRef",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VesselTypeCargoPolicy",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vesselTypeRefId = table.Column<int>(type: "integer", nullable: false),
                    vesselTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    cargoTypeRefId = table.Column<int>(type: "integer", nullable: false),
                    cargoTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    isAllowed = table.Column<bool>(type: "boolean", nullable: false),
                    isDefault = table.Column<bool>(type: "boolean", nullable: false),
                    defaultCapacityValue = table.Column<decimal>(type: "numeric", nullable: true),
                    defaultCapacityUnit = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    capacityBasis = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_VesselTypeCargoPolicy", x => x.id);
                    table.ForeignKey(
                        name: "fK_VesselTypeCargoPolicy_CargoTypeRef_cargoTypeRefId",
                        column: x => x.cargoTypeRefId,
                        principalTable: "CargoTypeRef",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fK_VesselTypeCargoPolicy_VesselTypeRef_vesselTypeRefId",
                        column: x => x.vesselTypeRefId,
                        principalTable: "VesselTypeRef",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "iX_AuditLog_publicId",
                table: "AuditLog",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_AuditLog_tenantId",
                table: "AuditLog",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_CargoTypeRef_productTypeId",
                table: "CargoTypeRef",
                column: "productTypeId");

            migrationBuilder.CreateIndex(
                name: "iX_CargoTypeRef_publicId",
                table: "CargoTypeRef",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_CargoTypeRef_tenantId",
                table: "CargoTypeRef",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_Country_publicId",
                table: "Country",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Country_tenantId",
                table: "Country",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_CountryAlias_countryId",
                table: "CountryAlias",
                column: "countryId");

            migrationBuilder.CreateIndex(
                name: "iX_CountryAlias_publicId",
                table: "CountryAlias",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_CountryAlias_tenantId",
                table: "CountryAlias",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_CountryMaritimeZone_publicId",
                table: "CountryMaritimeZone",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_CountryMaritimeZone_tenantId",
                table: "CountryMaritimeZone",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_DocumentCategory_publicId",
                table: "DocumentCategory",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_DocumentCategory_tenantId",
                table: "DocumentCategory",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_DocumentType_categoryId",
                table: "DocumentType",
                column: "categoryId");

            migrationBuilder.CreateIndex(
                name: "iX_DocumentType_publicId",
                table: "DocumentType",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_DocumentType_tenantId",
                table: "DocumentType",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_DocumentTypeExternalCode_documentTypeId",
                table: "DocumentTypeExternalCode",
                column: "documentTypeId");

            migrationBuilder.CreateIndex(
                name: "iX_DocumentTypeExternalCode_publicId",
                table: "DocumentTypeExternalCode",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_DocumentTypeExternalCode_tenantId",
                table: "DocumentTypeExternalCode",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_FuelTypeRef_publicId",
                table: "FuelTypeRef",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_FuelTypeRef_tenantId",
                table: "FuelTypeRef",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_IssuingAuthority_countryId",
                table: "IssuingAuthority",
                column: "countryId");

            migrationBuilder.CreateIndex(
                name: "iX_IssuingAuthority_publicId",
                table: "IssuingAuthority",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_IssuingAuthority_tenantId",
                table: "IssuingAuthority",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_MapConfiguration_publicId",
                table: "MapConfiguration",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_MapConfiguration_tenantId",
                table: "MapConfiguration",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_MaritimeZone_publicId",
                table: "MaritimeZone",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_MaritimeZone_tenantId",
                table: "MaritimeZone",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_ProductTypeRef_publicId",
                table: "ProductTypeRef",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_ProductTypeRef_tenantId",
                table: "ProductTypeRef",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_SystemTag_publicId",
                table: "SystemTag",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_SystemTag_tenantId",
                table: "SystemTag",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_TerminalType_publicId",
                table: "TerminalType",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_TerminalType_tenantId",
                table: "TerminalType",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_UdfConfiguration_publicId",
                table: "UdfConfiguration",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_UdfConfiguration_tenantId",
                table: "UdfConfiguration",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_UdfListValue_publicId",
                table: "UdfListValue",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_UdfListValue_tenantId",
                table: "UdfListValue",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_UdfListValue_udfConfigurationId",
                table: "UdfListValue",
                column: "udfConfigurationId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeAllowedCargoType_cargoTypeRefId",
                table: "VesselTypeAllowedCargoType",
                column: "cargoTypeRefId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeAllowedCargoType_publicId",
                table: "VesselTypeAllowedCargoType",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeAllowedCargoType_tenantId",
                table: "VesselTypeAllowedCargoType",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeAllowedCargoType_vesselTypeRefId",
                table: "VesselTypeAllowedCargoType",
                column: "vesselTypeRefId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeAllowedFuelType_fuelTypeRefId",
                table: "VesselTypeAllowedFuelType",
                column: "fuelTypeRefId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeAllowedFuelType_publicId",
                table: "VesselTypeAllowedFuelType",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeAllowedFuelType_tenantId",
                table: "VesselTypeAllowedFuelType",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeAllowedFuelType_vesselTypeRefId",
                table: "VesselTypeAllowedFuelType",
                column: "vesselTypeRefId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeCargoPolicy_cargoTypeRefId",
                table: "VesselTypeCargoPolicy",
                column: "cargoTypeRefId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeCargoPolicy_publicId",
                table: "VesselTypeCargoPolicy",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeCargoPolicy_tenantId",
                table: "VesselTypeCargoPolicy",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeCargoPolicy_vesselTypeRefId",
                table: "VesselTypeCargoPolicy",
                column: "vesselTypeRefId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeFuelTankPolicy_fuelTypeRefId",
                table: "VesselTypeFuelTankPolicy",
                column: "fuelTypeRefId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeFuelTankPolicy_publicId",
                table: "VesselTypeFuelTankPolicy",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeFuelTankPolicy_tenantId",
                table: "VesselTypeFuelTankPolicy",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeFuelTankPolicy_vesselTypeRefId",
                table: "VesselTypeFuelTankPolicy",
                column: "vesselTypeRefId");

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeRef_publicId",
                table: "VesselTypeRef",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_VesselTypeRef_tenantId",
                table: "VesselTypeRef",
                column: "tenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLog");

            migrationBuilder.DropTable(
                name: "CountryAlias");

            migrationBuilder.DropTable(
                name: "CountryMaritimeZone");

            migrationBuilder.DropTable(
                name: "DocumentTypeExternalCode");

            migrationBuilder.DropTable(
                name: "IssuingAuthority");

            migrationBuilder.DropTable(
                name: "MapConfiguration");

            migrationBuilder.DropTable(
                name: "MaritimeZone");

            migrationBuilder.DropTable(
                name: "SystemAuditLog");

            migrationBuilder.DropTable(
                name: "SystemTag");

            migrationBuilder.DropTable(
                name: "TerminalType");

            migrationBuilder.DropTable(
                name: "UdfListValue");

            migrationBuilder.DropTable(
                name: "VesselTypeAllowedCargoType");

            migrationBuilder.DropTable(
                name: "VesselTypeAllowedFuelType");

            migrationBuilder.DropTable(
                name: "VesselTypeCargoPolicy");

            migrationBuilder.DropTable(
                name: "VesselTypeFuelTankPolicy");

            migrationBuilder.DropTable(
                name: "DocumentType");

            migrationBuilder.DropTable(
                name: "Country");

            migrationBuilder.DropTable(
                name: "UdfConfiguration");

            migrationBuilder.DropTable(
                name: "CargoTypeRef");

            migrationBuilder.DropTable(
                name: "FuelTypeRef");

            migrationBuilder.DropTable(
                name: "VesselTypeRef");

            migrationBuilder.DropTable(
                name: "DocumentCategory");

            migrationBuilder.DropTable(
                name: "ProductTypeRef");
        }
    }
}
