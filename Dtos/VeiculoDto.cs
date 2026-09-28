using System.ComponentModel.DataAnnotations;

namespace LocadoraVeiculosApi.Dtos;

public class VeiculoDto : IValidatableObject
{
    [Required(ErrorMessage = "A placa é obrigatória.")]
    [RegularExpression(@"^[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}$", ErrorMessage = "A placa deve estar no formato ABC1234, ABC-1234 ou ABC1D23.")]
    public string Placa { get; set; } = string.Empty;

    [Required(ErrorMessage = "O modelo é obrigatório.")]
    [MaxLength(100, ErrorMessage = "O modelo deve ter no máximo 100 caracteres.")]
    public string Modelo { get; set; } = string.Empty;

    public int AnoFabricacao { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "A quilometragem não pode ser negativa.")]
    public int Quilometragem { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Informe um fabricante válido.")]
    public int FabricanteId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Informe uma categoria válida.")]
    public int CategoriaId { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var anoMaximo = DateTime.Today.Year + 1;

        if (AnoFabricacao < 1900 || AnoFabricacao > anoMaximo)
        {
            yield return new ValidationResult(
                $"O ano de fabricação deve estar entre 1900 e {anoMaximo}.",
                new[] { nameof(AnoFabricacao) });
        }
    }
}
