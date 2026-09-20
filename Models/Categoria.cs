using System.ComponentModel.DataAnnotations;

namespace LocadoraVeiculosApi.Models;

public class Categoria
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(80)]
    public string Nome { get; set; } = string.Empty;

    public ICollection<Veiculo> Veiculos { get; set; } = new List<Veiculo>();
}
