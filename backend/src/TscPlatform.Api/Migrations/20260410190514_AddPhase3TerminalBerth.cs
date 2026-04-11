using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TscPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase3TerminalBerth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Berth",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    terminalPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    berthCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    berthName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    berthNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    berthType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    productTypeRefIds = table.Column<string[]>(type: "text[]", nullable: false),
                    maxLoa = table.Column<double>(type: "double precision", nullable: true),
                    maxBeam = table.Column<double>(type: "double precision", nullable: true),
                    maxDraft = table.Column<double>(type: "double precision", nullable: true),
                    minCargoCapacity = table.Column<double>(type: "double precision", nullable: true),
                    maxCargoCapacity = table.Column<double>(type: "double precision", nullable: true),
                    qmaxCapable = table.Column<bool>(type: "boolean", nullable: false),
                    qflexCapable = table.Column<bool>(type: "boolean", nullable: false),
                    maxCargoCapacityM3 = table.Column<double>(type: "double precision", nullable: true),
                    maxLoaM = table.Column<double>(type: "double precision", nullable: true),
                    maxBeamM = table.Column<double>(type: "double precision", nullable: true),
                    maxArrivalDraftM = table.Column<double>(type: "double precision", nullable: true),
                    maxArrivalDisplacementT = table.Column<double>(type: "double precision", nullable: true),
                    manifoldLimitsNotes = table.Column<string>(type: "text", nullable: true),
                    manifoldHeightMin = table.Column<double>(type: "double precision", nullable: true),
                    manifoldHeightMax = table.Column<double>(type: "double precision", nullable: true),
                    loadingArmsLngCount = table.Column<int>(type: "integer", nullable: true),
                    vapourReturnAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    typicalLoadingRateNotes = table.Column<string>(type: "text", nullable: true),
                    loadingArms = table.Column<int>(type: "integer", nullable: true),
                    fendersType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    bollardsCapacity = table.Column<double>(type: "double precision", nullable: true),
                    @operator = table.Column<string>(name: "operator", type: "character varying(200)", maxLength: 200, nullable: true),
                    dataSource = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    lastVerifiedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    isArchived = table.Column<bool>(type: "boolean", nullable: false),
                    archivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    archivedReason = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Berth", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Terminal",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    port = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    countryId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    countryPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    legacyCountryCode = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    legacyCountryName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    siteId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    sitePublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    terminalComplexId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    terminalComplexPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    productTypeRefId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    productTypeRefPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    terminalTypeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    terminalTypePublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    latitude = table.Column<double>(type: "double precision", nullable: true),
                    longitude = table.Column<double>(type: "double precision", nullable: true),
                    operationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    @operator = table.Column<string>(name: "operator", type: "character varying(200)", maxLength: 200, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    isArchived = table.Column<bool>(type: "boolean", nullable: false),
                    archivedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    archivedReason = table.Column<string>(type: "text", nullable: true),
                    contactEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    contactPhone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    timezone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    capacityMtpa = table.Column<double>(type: "double precision", nullable: true),
                    storageCapacity = table.Column<double>(type: "double precision", nullable: true),
                    numberOfTanks = table.Column<int>(type: "integer", nullable: true),
                    loadingRate = table.Column<double>(type: "double precision", nullable: true),
                    approachChannelDepth = table.Column<double>(type: "double precision", nullable: true),
                    pilotageRequired = table.Column<bool>(type: "boolean", nullable: false),
                    tugsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    procedureNotes = table.Column<string>(type: "text", nullable: true),
                    formsNotes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Terminal", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "TerminalComplex",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    countryId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    countryPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    region = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    latitude = table.Column<double>(type: "double precision", nullable: true),
                    longitude = table.Column<double>(type: "double precision", nullable: true),
                    operatorAuthority = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_TerminalComplex", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "iX_Berth_publicId",
                table: "Berth",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Berth_tenantId",
                table: "Berth",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_Terminal_publicId",
                table: "Terminal",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Terminal_tenantId",
                table: "Terminal",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_TerminalComplex_publicId",
                table: "TerminalComplex",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_TerminalComplex_tenantId",
                table: "TerminalComplex",
                column: "tenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Berth");

            migrationBuilder.DropTable(
                name: "Terminal");

            migrationBuilder.DropTable(
                name: "TerminalComplex");
        }
    }
}
