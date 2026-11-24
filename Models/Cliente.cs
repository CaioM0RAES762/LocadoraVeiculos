using System.ComponentModel.DataAnnotations;

namespace LocadoraVeiculosApi.Models;

public class Cliente
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(120)]
    public string Nome { get; set; } = string.Empty;

    [Required]
    [MaxLength(11)]
    public string Cpf { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    public ICollection<Aluguel> Alugueis { get; set; } = new List<Aluguel>();
}
