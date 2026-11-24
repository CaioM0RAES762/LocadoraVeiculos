using System.ComponentModel.DataAnnotations;

namespace LocadoraVeiculosApi.Dtos;

public class FabricanteDto
{
    [Required(ErrorMessage = "O nome do fabricante é obrigatório.")]
    [MaxLength(100, ErrorMessage = "O nome do fabricante deve ter no máximo 100 caracteres.")]
    public string Nome { get; set; } = string.Empty;
}
