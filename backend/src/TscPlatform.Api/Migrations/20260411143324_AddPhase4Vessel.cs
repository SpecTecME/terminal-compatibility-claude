using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TscPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase4Vessel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Vessel",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    vesselInternalId = table.Column<string>(type: "text", nullable: true),
                    imoNumber = table.Column<string>(type: "text", nullable: true),
                    mmsi = table.Column<string>(type: "text", nullable: true),
                    callSign = table.Column<string>(type: "text", nullable: true),
                    vesselTypeRefId = table.Column<int>(type: "integer", nullable: true),
                    vesselTypeRefPublicId = table.Column<string>(type: "text", nullable: true),
                    flagCountryId = table.Column<int>(type: "integer", nullable: true),
                    flagCountryPublicId = table.Column<string>(type: "text", nullable: true),
                    ownerCompanyId = table.Column<int>(type: "integer", nullable: true),
                    ownerCompanyPublicId = table.Column<string>(type: "text", nullable: true),
                    operatorCompanyId = table.Column<int>(type: "integer", nullable: true),
                    operatorCompanyPublicId = table.Column<string>(type: "text", nullable: true),
                    classSocietyCompanyId = table.Column<int>(type: "integer", nullable: true),
                    classSocietyCompanyPublicId = table.Column<string>(type: "text", nullable: true),
                    udf01 = table.Column<string>(type: "text", nullable: true),
                    udf02 = table.Column<string>(type: "text", nullable: true),
                    yearBuilt = table.Column<int>(type: "integer", nullable: true),
                    shipyard = table.Column<string>(type: "text", nullable: true),
                    classNotation = table.Column<string>(type: "text", nullable: true),
                    loaM = table.Column<double>(type: "double precision", nullable: true),
                    widthM = table.Column<double>(type: "double precision", nullable: true),
                    beamM = table.Column<double>(type: "double precision", nullable: true),
                    depthM = table.Column<double>(type: "double precision", nullable: true),
                    lbpM = table.Column<double>(type: "double precision", nullable: true),
                    mouldedDepthM = table.Column<double>(type: "double precision", nullable: true),
                    breadthMouldedM = table.Column<double>(type: "double precision", nullable: true),
                    summerDraftM = table.Column<double>(type: "double precision", nullable: true),
                    designDraftM = table.Column<double>(type: "double precision", nullable: true),
                    maxDraftM = table.Column<double>(type: "double precision", nullable: true),
                    airDraftM = table.Column<double>(type: "double precision", nullable: true),
                    displacementSummerT = table.Column<double>(type: "double precision", nullable: true),
                    gt = table.Column<double>(type: "double precision", nullable: true),
                    ntItc69 = table.Column<double>(type: "double precision", nullable: true),
                    dwt = table.Column<double>(type: "double precision", nullable: true),
                    cargoContainmentType = table.Column<string>(type: "text", nullable: true),
                    cargoCapacityM3 = table.Column<double>(type: "double precision", nullable: true),
                    maxLoadingRateM3Ph = table.Column<double>(type: "double precision", nullable: true),
                    maxDischargeRateM3Ph = table.Column<double>(type: "double precision", nullable: true),
                    vapourReturnSupported = table.Column<bool>(type: "boolean", nullable: false),
                    esdErcType = table.Column<string>(type: "text", nullable: true),
                    berthingSideSupported = table.Column<string>(type: "text", nullable: true),
                    manifoldLngCount = table.Column<int>(type: "integer", nullable: true),
                    manifoldVapourCount = table.Column<int>(type: "integer", nullable: true),
                    lngManifoldHeightMinM = table.Column<double>(type: "double precision", nullable: true),
                    lngManifoldHeightMaxM = table.Column<double>(type: "double precision", nullable: true),
                    vapourManifoldHeightMinM = table.Column<double>(type: "double precision", nullable: true),
                    vapourManifoldHeightMaxM = table.Column<double>(type: "double precision", nullable: true),
                    manifoldSpacingPitchMm = table.Column<double>(type: "double precision", nullable: true),
                    manifoldToBowM = table.Column<double>(type: "double precision", nullable: true),
                    manifoldToSternM = table.Column<double>(type: "double precision", nullable: true),
                    flangeSizeLngIn = table.Column<string>(type: "text", nullable: true),
                    flangeRating = table.Column<string>(type: "text", nullable: true),
                    ercManufacturerModel = table.Column<string>(type: "text", nullable: true),
                    mooringWinches = table.Column<int>(type: "integer", nullable: true),
                    mooringLinesTotal = table.Column<int>(type: "integer", nullable: true),
                    headLines = table.Column<int>(type: "integer", nullable: true),
                    breastLinesForward = table.Column<int>(type: "integer", nullable: true),
                    springsForward = table.Column<int>(type: "integer", nullable: true),
                    sternLines = table.Column<int>(type: "integer", nullable: true),
                    breastLinesAft = table.Column<int>(type: "integer", nullable: true),
                    springsAft = table.Column<int>(type: "integer", nullable: true),
                    lineType = table.Column<string>(type: "text", nullable: true),
                    lineMblKn = table.Column<double>(type: "double precision", nullable: true),
                    brakeHoldingCapacityKn = table.Column<double>(type: "double precision", nullable: true),
                    chockType = table.Column<string>(type: "text", nullable: true),
                    fairleadChockPositionsNotes = table.Column<string>(type: "text", nullable: true),
                    fenderContactZone = table.Column<string>(type: "text", nullable: true),
                    shellPlatingRestrictions = table.Column<string>(type: "text", nullable: true),
                    fenderPointLoadLimitKn = table.Column<double>(type: "double precision", nullable: true),
                    preferredFenderType = table.Column<string>(type: "text", nullable: true),
                    maxWindBerthingKn = table.Column<double>(type: "double precision", nullable: true),
                    maxWindAlongsideKn = table.Column<double>(type: "double precision", nullable: true),
                    maxCurrentAlongsideKn = table.Column<double>(type: "double precision", nullable: true),
                    maxWaveHeightM = table.Column<double>(type: "double precision", nullable: true),
                    tideRangeMinM = table.Column<double>(type: "double precision", nullable: true),
                    tideRangeMaxM = table.Column<double>(type: "double precision", nullable: true),
                    tugRequirementsNotes = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    imageUrl = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Vessel", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "iX_Vessel_publicId",
                table: "Vessel",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Vessel_tenantId",
                table: "Vessel",
                column: "tenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Vessel");
        }
    }
}
