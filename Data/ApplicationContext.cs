using LocadoraVeiculosApi.Models;
using Microsoft.EntityFrameworkCore;

namespace LocadoraVeiculosApi.Data;

public class ApplicationContext : DbContext
{
    public ApplicationContext(DbContextOptions<ApplicationContext> options)
        : base(options)
    {
    }

    public DbSet<Fabricante> Fabricantes => Set<Fabricante>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Veiculo> Veiculos => Set<Veiculo>();
    public DbSet<Aluguel> Alugueis => Set<Aluguel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Fabricante>().HasKey(f => f.Id);
        modelBuilder.Entity<Categoria>().HasKey(c => c.Id);
        modelBuilder.Entity<Cliente>().HasKey(c => c.Id);
        modelBuilder.Entity<Veiculo>().HasKey(v => v.Id);
        modelBuilder.Entity<Aluguel>().HasKey(a => a.Id);

        modelBuilder.Entity<Fabricante>()
            .HasIndex(f => f.Nome)
            .IsUnique();

        modelBuilder.Entity<Categoria>()
            .HasIndex(c => c.Nome)
            .IsUnique();

        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.Cpf)
            .IsUnique();

        modelBuilder.Entity<Cliente>()
            .HasIndex(c => c.Email)
            .IsUnique();

        modelBuilder.Entity<Veiculo>()
            .HasIndex(v => v.Placa)
            .IsUnique();

        modelBuilder.Entity<Veiculo>()
            .HasOne(v => v.Fabricante)
            .WithMany(f => f.Veiculos)
            .HasForeignKey(v => v.FabricanteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Veiculo>()
            .HasOne(v => v.Categoria)
            .WithMany(c => c.Veiculos)
            .HasForeignKey(v => v.CategoriaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Aluguel>()
            .HasOne(a => a.Cliente)
            .WithMany(c => c.Alugueis)
            .HasForeignKey(a => a.ClienteId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Aluguel>()
            .HasOne(a => a.Veiculo)
            .WithMany(v => v.Alugueis)
            .HasForeignKey(a => a.VeiculoId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Aluguel>()
            .Property(a => a.ValorDiaria)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Aluguel>()
            .Property(a => a.ValorTotal)
            .HasPrecision(10, 2);

        modelBuilder.Entity<Veiculo>()
            .ToTable("Veiculos", table =>
            {
                table.HasCheckConstraint("CK_Veiculos_AnoFabricacao", "[AnoFabricacao] >= 1900");
                table.HasCheckConstraint("CK_Veiculos_Quilometragem", "[Quilometragem] >= 0");
            });

        modelBuilder.Entity<Aluguel>()
            .ToTable("Alugueis", table =>
            {
                table.HasCheckConstraint("CK_Alugueis_Periodo", "[DataFimPrevista] > [DataInicio]");
                table.HasCheckConstraint("CK_Alugueis_QuilometragemInicial", "[QuilometragemInicial] >= 0");
                table.HasCheckConstraint("CK_Alugueis_QuilometragemFinal", "[QuilometragemFinal] IS NULL OR [QuilometragemFinal] >= [QuilometragemInicial]");
                table.HasCheckConstraint("CK_Alugueis_ValorDiaria", "[ValorDiaria] > 0");
                table.HasCheckConstraint("CK_Alugueis_ValorTotal", "[ValorTotal] IS NULL OR [ValorTotal] >= 0");
            });
    }
}
