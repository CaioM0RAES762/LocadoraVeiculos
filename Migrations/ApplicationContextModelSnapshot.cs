using LocadoraVeiculosApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;

#nullable disable

namespace LocadoraVeiculosApi.Migrations;

[DbContext(typeof(ApplicationContext))]
partial class ApplicationContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder
            .HasAnnotation("ProductVersion", "9.0.0")
            .HasAnnotation("Relational:MaxIdentifierLength", 128);

        SqlServerModelBuilderExtensions.UseIdentityColumns(modelBuilder);

        modelBuilder.Entity("LocadoraVeiculosApi.Models.Aluguel", b =>
        {
            b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int");
            SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));
            b.Property<int>("ClienteId").HasColumnType("int");
            b.Property<DateTime?>("DataDevolucao").HasColumnType("datetime2");
            b.Property<DateTime>("DataFimPrevista").HasColumnType("datetime2");
            b.Property<DateTime>("DataInicio").HasColumnType("datetime2");
            b.Property<int?>("QuilometragemFinal").HasColumnType("int");
            b.Property<int>("QuilometragemInicial").HasColumnType("int");
            b.Property<decimal>("ValorDiaria").HasPrecision(10, 2).HasColumnType("decimal(10,2)");
            b.Property<decimal?>("ValorTotal").HasPrecision(10, 2).HasColumnType("decimal(10,2)");
            b.Property<int>("VeiculoId").HasColumnType("int");
            b.HasKey("Id");
            b.HasIndex("ClienteId");
            b.HasIndex("VeiculoId");
            b.ToTable("Alugueis", t =>
            {
                t.HasCheckConstraint("CK_Alugueis_Periodo", "[DataFimPrevista] > [DataInicio]");
                t.HasCheckConstraint("CK_Alugueis_QuilometragemFinal", "[QuilometragemFinal] IS NULL OR [QuilometragemFinal] >= [QuilometragemInicial]");
                t.HasCheckConstraint("CK_Alugueis_QuilometragemInicial", "[QuilometragemInicial] >= 0");
                t.HasCheckConstraint("CK_Alugueis_ValorDiaria", "[ValorDiaria] > 0");
                t.HasCheckConstraint("CK_Alugueis_ValorTotal", "[ValorTotal] IS NULL OR [ValorTotal] >= 0");
            });
        });

        modelBuilder.Entity("LocadoraVeiculosApi.Models.Categoria", b =>
        {
            b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int");
            SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));
            b.Property<string>("Nome").IsRequired().HasMaxLength(80).HasColumnType("nvarchar(80)");
            b.HasKey("Id");
            b.HasIndex("Nome").IsUnique();
            b.ToTable("Categorias");
        });

        modelBuilder.Entity("LocadoraVeiculosApi.Models.Cliente", b =>
        {
            b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int");
            SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));
            b.Property<string>("Cpf").IsRequired().HasMaxLength(11).HasColumnType("nvarchar(11)");
            b.Property<string>("Email").IsRequired().HasMaxLength(150).HasColumnType("nvarchar(150)");
            b.Property<string>("Nome").IsRequired().HasMaxLength(120).HasColumnType("nvarchar(120)");
            b.HasKey("Id");
            b.HasIndex("Cpf").IsUnique();
            b.HasIndex("Email").IsUnique();
            b.ToTable("Clientes");
        });

        modelBuilder.Entity("LocadoraVeiculosApi.Models.Fabricante", b =>
        {
            b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int");
            SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));
            b.Property<string>("Nome").IsRequired().HasMaxLength(100).HasColumnType("nvarchar(100)");
            b.HasKey("Id");
            b.HasIndex("Nome").IsUnique();
            b.ToTable("Fabricantes");
        });

        modelBuilder.Entity("LocadoraVeiculosApi.Models.Veiculo", b =>
        {
            b.Property<int>("Id").ValueGeneratedOnAdd().HasColumnType("int");
            SqlServerPropertyBuilderExtensions.UseIdentityColumn(b.Property<int>("Id"));
            b.Property<int>("AnoFabricacao").HasColumnType("int");
            b.Property<int>("CategoriaId").HasColumnType("int");
            b.Property<int>("FabricanteId").HasColumnType("int");
            b.Property<string>("Modelo").IsRequired().HasMaxLength(100).HasColumnType("nvarchar(100)");
            b.Property<string>("Placa").IsRequired().HasMaxLength(10).HasColumnType("nvarchar(10)");
            b.Property<int>("Quilometragem").HasColumnType("int");
            b.HasKey("Id");
            b.HasIndex("CategoriaId");
            b.HasIndex("FabricanteId");
            b.HasIndex("Placa").IsUnique();
            b.ToTable("Veiculos", t =>
            {
                t.HasCheckConstraint("CK_Veiculos_AnoFabricacao", "[AnoFabricacao] >= 1900");
                t.HasCheckConstraint("CK_Veiculos_Quilometragem", "[Quilometragem] >= 0");
            });
        });

        modelBuilder.Entity("LocadoraVeiculosApi.Models.Aluguel", b =>
        {
            b.HasOne("LocadoraVeiculosApi.Models.Cliente", "Cliente")
                .WithMany("Alugueis")
                .HasForeignKey("ClienteId")
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            b.HasOne("LocadoraVeiculosApi.Models.Veiculo", "Veiculo")
                .WithMany("Alugueis")
                .HasForeignKey("VeiculoId")
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            b.Navigation("Cliente");
            b.Navigation("Veiculo");
        });

        modelBuilder.Entity("LocadoraVeiculosApi.Models.Veiculo", b =>
        {
            b.HasOne("LocadoraVeiculosApi.Models.Categoria", "Categoria")
                .WithMany("Veiculos")
                .HasForeignKey("CategoriaId")
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            b.HasOne("LocadoraVeiculosApi.Models.Fabricante", "Fabricante")
                .WithMany("Veiculos")
                .HasForeignKey("FabricanteId")
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            b.Navigation("Categoria");
            b.Navigation("Fabricante");
        });

        modelBuilder.Entity("LocadoraVeiculosApi.Models.Categoria", b => b.Navigation("Veiculos"));
        modelBuilder.Entity("LocadoraVeiculosApi.Models.Cliente", b => b.Navigation("Alugueis"));
        modelBuilder.Entity("LocadoraVeiculosApi.Models.Fabricante", b => b.Navigation("Veiculos"));
        modelBuilder.Entity("LocadoraVeiculosApi.Models.Veiculo", b => b.Navigation("Alugueis"));
#pragma warning restore 612, 618
    }
}
