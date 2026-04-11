using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TscPlatform.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPhase2TagAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CompanySystemTagAssignment",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    companyId = table.Column<int>(type: "integer", nullable: false),
                    companyPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    systemTagId = table.Column<int>(type: "integer", nullable: false),
                    systemTagPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_CompanySystemTagAssignment", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "SystemTagAssignment",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    contactId = table.Column<int>(type: "integer", nullable: false),
                    contactPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    systemTagId = table.Column<int>(type: "integer", nullable: false),
                    systemTagPublicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: true),
                    publicId = table.Column<string>(type: "character varying(36)", maxLength: 36, nullable: false),
                    tenantId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pK_SystemTagAssignment", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "iX_CompanySystemTagAssignment_companyId",
                table: "CompanySystemTagAssignment",
                column: "companyId");

            migrationBuilder.CreateIndex(
                name: "iX_CompanySystemTagAssignment_publicId",
                table: "CompanySystemTagAssignment",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_CompanySystemTagAssignment_systemTagId",
                table: "CompanySystemTagAssignment",
                column: "systemTagId");

            migrationBuilder.CreateIndex(
                name: "iX_CompanySystemTagAssignment_tenantId",
                table: "CompanySystemTagAssignment",
                column: "tenantId");

            migrationBuilder.CreateIndex(
                name: "iX_SystemTagAssignment_contactId",
                table: "SystemTagAssignment",
                column: "contactId");

            migrationBuilder.CreateIndex(
                name: "iX_SystemTagAssignment_publicId",
                table: "SystemTagAssignment",
                column: "publicId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "iX_SystemTagAssignment_systemTagId",
                table: "SystemTagAssignment",
                column: "systemTagId");

            migrationBuilder.CreateIndex(
                name: "iX_SystemTagAssignment_tenantId",
                table: "SystemTagAssignment",
                column: "tenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanySystemTagAssignment");

            migrationBuilder.DropTable(
                name: "SystemTagAssignment");
        }
    }
}
