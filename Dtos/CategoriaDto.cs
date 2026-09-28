using System.ComponentModel.DataAnnotations;

namespace LocadoraVeiculosApi.Dtos;

public class CategoriaDto
{
    [Required(ErrorMessage = "O nome da categoria é obrigatório.")]
    [MaxLength(80, ErrorMessage = "O nome da categoria deve ter no máximo 80 caracteres.")]
    public string Nome { get; set; } = string.Empty;
}
