using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TscPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase4Document : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Document",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    vesselId = table.Column<int>(type: "integer", nullable: true),
                    vesselPublicId = table.Column<string>(type: "text", nullable: true),
                    documentTypeId = table.Column<int>(type: "integer", nullable: true),
                    documentTypePublicId = table.Column<string>(type: "text", nullable: true),
                    terminalId = table.Column<int>(type: "integer", nullable: true),
                    terminalPublicId = table.Column<string>(type: "text", nullable: true),
                    berthId = table.Column<int>(type: "integer", nullable: true),
                    berthPublicId = table.Column<string>(type: "text", nullable: true),
                    terminalFormId = table.Column<int>(type: "integer", nullable: true),
                    terminalFormPublicId = table.Column<string>(type: "text", nullable: true),
                    intendedVisitDate = table.Column<DateOnly>(type: "date", nullable: true),
                    documentName = table.Column<string>(type: "text", nullable: true),
                    legacyDocumentType = table.Column<string>(type: "text", nullable: true),
                    category = table.Column<string>(type: "text", nullable: true),
                    fileUrl = table.Column<string>(type: "text", nullable: true),
                    issueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    expiryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    legacyIssuingAuthority = table.Column<string>(type: "text", nullable: true),
                    issuingAuthorityId = table.Column<int>(type: "integer", nullable: true),
                    issuingAuthorityPublicId = table.Column<string>(type: "text", nullable: true),
                    referenceNumber = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_Document", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "iX_Document_publicId",
                table: "Document",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_Document_tenantId",
                table: "Document",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_Document_vesselId",
                table: "Document",
                column: "vesselId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Document");
        }
    }
}
