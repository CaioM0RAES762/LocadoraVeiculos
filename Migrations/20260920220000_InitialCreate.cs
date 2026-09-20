using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LocadoraVeiculosApi.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Categorias",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Nome = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Categorias", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Clientes",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Nome = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                Cpf = table.Column<string>(type: "nvarchar(11)", maxLength: 11, nullable: false),
                Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Clientes", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Fabricantes",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Fabricantes", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Veiculos",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Placa = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                Modelo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                AnoFabricacao = table.Column<int>(type: "int", nullable: false),
                Quilometragem = table.Column<int>(type: "int", nullable: false),
                FabricanteId = table.Column<int>(type: "int", nullable: false),
                CategoriaId = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Veiculos", x => x.Id);
                table.CheckConstraint("CK_Veiculos_AnoFabricacao", "[AnoFabricacao] >= 1900");
                table.CheckConstraint("CK_Veiculos_Quilometragem", "[Quilometragem] >= 0");
                table.ForeignKey(
                    name: "FK_Veiculos_Categorias_CategoriaId",
                    column: x => x.CategoriaId,
                    principalTable: "Categorias",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Veiculos_Fabricantes_FabricanteId",
                    column: x => x.FabricanteId,
                    principalTable: "Fabricantes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "Alugueis",
            columns: table => new
            {
                Id = table.Column<int>(type: "int", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ClienteId = table.Column<int>(type: "int", nullable: false),
                VeiculoId = table.Column<int>(type: "int", nullable: false),
                DataInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                DataFimPrevista = table.Column<DateTime>(type: "datetime2", nullable: false),
                DataDevolucao = table.Column<DateTime>(type: "datetime2", nullable: true),
                QuilometragemInicial = table.Column<int>(type: "int", nullable: false),
                QuilometragemFinal = table.Column<int>(type: "int", nullable: true),
                ValorDiaria = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                ValorTotal = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Alugueis", x => x.Id);
                table.CheckConstraint("CK_Alugueis_Periodo", "[DataFimPrevista] > [DataInicio]");
                table.CheckConstraint("CK_Alugueis_QuilometragemFinal", "[QuilometragemFinal] IS NULL OR [QuilometragemFinal] >= [QuilometragemInicial]");
                table.CheckConstraint("CK_Alugueis_QuilometragemInicial", "[QuilometragemInicial] >= 0");
                table.CheckConstraint("CK_Alugueis_ValorDiaria", "[ValorDiaria] > 0");
                table.CheckConstraint("CK_Alugueis_ValorTotal", "[ValorTotal] IS NULL OR [ValorTotal] >= 0");
                table.ForeignKey(
                    name: "FK_Alugueis_Clientes_ClienteId",
                    column: x => x.ClienteId,
                    principalTable: "Clientes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_Alugueis_Veiculos_VeiculoId",
                    column: x => x.VeiculoId,
                    principalTable: "Veiculos",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Alugueis_ClienteId",
            table: "Alugueis",
            column: "ClienteId");

        migrationBuilder.CreateIndex(
            name: "IX_Alugueis_VeiculoId",
            table: "Alugueis",
            column: "VeiculoId");

        migrationBuilder.CreateIndex(
            name: "IX_Categorias_Nome",
            table: "Categorias",
            column: "Nome",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Clientes_Cpf",
            table: "Clientes",
            column: "Cpf",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Clientes_Email",
            table: "Clientes",
            column: "Email",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Fabricantes_Nome",
            table: "Fabricantes",
            column: "Nome",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Veiculos_CategoriaId",
            table: "Veiculos",
            column: "CategoriaId");

        migrationBuilder.CreateIndex(
            name: "IX_Veiculos_FabricanteId",
            table: "Veiculos",
            column: "FabricanteId");

        migrationBuilder.CreateIndex(
            name: "IX_Veiculos_Placa",
            table: "Veiculos",
            column: "Placa",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Alugueis");
        migrationBuilder.DropTable(name: "Clientes");
        migrationBuilder.DropTable(name: "Veiculos");
        migrationBuilder.DropTable(name: "Categorias");
        migrationBuilder.DropTable(name: "Fabricantes");
    }
}
