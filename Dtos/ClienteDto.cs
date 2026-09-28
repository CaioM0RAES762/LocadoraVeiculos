using System.ComponentModel.DataAnnotations;

namespace LocadoraVeiculosApi.Dtos;

public class ClienteDto
{
    [Required(ErrorMessage = "O nome do cliente é obrigatório.")]
    [MaxLength(120, ErrorMessage = "O nome do cliente deve ter no máximo 120 caracteres.")]
    public string Nome { get; set; } = string.Empty;

    [Required(ErrorMessage = "O CPF é obrigatório.")]
    [RegularExpression(@"^\d{11}$", ErrorMessage = "O CPF deve conter exatamente 11 dígitos numéricos.")]
    public string Cpf { get; set; } = string.Empty;

    [Required(ErrorMessage = "O e-mail é obrigatório.")]
    [EmailAddress(ErrorMessage = "O e-mail informado não é válido.")]
    [MaxLength(150, ErrorMessage = "O e-mail deve ter no máximo 150 caracteres.")]
    public string Email { get; set; } = string.Empty;
}
