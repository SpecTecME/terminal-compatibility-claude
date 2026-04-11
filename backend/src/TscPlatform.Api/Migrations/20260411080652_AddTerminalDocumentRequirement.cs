using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TscPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTerminalDocumentRequirement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TerminalDocumentRequirement",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    terminalPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    terminalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    berthPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    berthId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    documentTypePublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    documentTypeId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    appliesLevel = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    submissionStage = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    isRequired = table.Column<bool>(type: "boolean", nullable: false),
                    effectiveFrom = table.Column<DateOnly>(type: "date", nullable: true),
                    validTo = table.Column<DateOnly>(type: "date", nullable: true),
                    isActive = table.Column<bool>(type: "boolean", nullable: false),
                    isMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    vesselConditionJson = table.Column<string>(type: "text", nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_TerminalDocumentRequirement", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "iX_TerminalDocumentRequirement_documentTypePublicId",
                table: "TerminalDocumentRequirement",
                column: "documentTypePublicId");

            migrationBuilder.CreateIndex(
                name: "iX_TerminalDocumentRequirement_publicId",
                table: "TerminalDocumentRequirement",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_TerminalDocumentRequirement_tenantId",
                table: "TerminalDocumentRequirement",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_TerminalDocumentRequirement_terminalPublicId",
                table: "TerminalDocumentRequirement",
                column: "terminalPublicId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TerminalDocumentRequirement");
        }
    }
}
