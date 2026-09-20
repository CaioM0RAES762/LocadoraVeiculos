using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LocadoraVeiculosApi.Models;

public class Aluguel
{
    [Key]
    public int Id { get; set; }

    public int ClienteId { get; set; }

    [ForeignKey(nameof(ClienteId))]
    public Cliente Cliente { get; set; } = null!;

    public int VeiculoId { get; set; }

    [ForeignKey(nameof(VeiculoId))]
    public Veiculo Veiculo { get; set; } = null!;

    public DateTime DataInicio { get; set; }

    public DateTime DataFimPrevista { get; set; }

    public DateTime? DataDevolucao { get; set; }

    public int QuilometragemInicial { get; set; }

    public int? QuilometragemFinal { get; set; }

    public decimal ValorDiaria { get; set; }

    public decimal? ValorTotal { get; set; }
}
