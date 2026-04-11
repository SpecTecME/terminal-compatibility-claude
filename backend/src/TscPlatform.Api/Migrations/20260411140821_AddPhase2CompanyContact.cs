using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TscPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase2CompanyContact : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Company",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    legalName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    countryId = table.Column<int>(type: "integer", nullable: true),
                    countryPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    hqAddressLine1 = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    hqCity = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    hqPostalCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    hqCountryId = table.Column<int>(type: "integer", nullable: true),
                    hqCountryPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    iacsMember = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    sortOrder = table.Column<int>(type: "integer", nullable: true),
                    mainContactId = table.Column<int>(type: "integer", nullable: true),
                    mainContactPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Company", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Contact",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    isGroupEmail = table.Column<bool>(type: "boolean", nullable: false),
                    groupName = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    firstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    lastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    preferredName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    phoneMobile = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    phoneOffice = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    whatsapp = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    preferredContactMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    timezone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    companyId = table.Column<int>(type: "integer", nullable: true),
                    companyPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    officeId = table.Column<int>(type: "integer", nullable: true),
                    officePublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    countryId = table.Column<int>(type: "integer", nullable: true),
                    countryPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    terminalId = table.Column<int>(type: "integer", nullable: true),
                    terminalPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    jobTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    department = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    dateOfBirth = table.Column<DateOnly>(type: "date", nullable: true),
                    religionOrObservance = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    observanceNotes = table.Column<string>(type: "text", nullable: true),
                    criticalRole = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Contact", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "iX_Company_publicId",
                table: "Company",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Company_tenantId",
                table: "Company",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_Contact_companyId",
                table: "Contact",
                column: "companyId");

            migrationBuilder.CreateIndex(
                name: "iX_Contact_publicId",
                table: "Contact",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Contact_tenantId",
                table: "Contact",
                column: "tenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Company");

            migrationBuilder.DropTable(
                name: "Contact");
        }
    }
}
