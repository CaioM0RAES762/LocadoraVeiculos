using System.ComponentModel.DataAnnotations;

namespace LocadoraVeiculosApi.Dtos;

public class AluguelDto : IValidatableObject
{
    [Range(1, int.MaxValue, ErrorMessage = "Informe um cliente válido.")]
    public int ClienteId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Informe um veículo válido.")]
    public int VeiculoId { get; set; }

    public DateTime DataInicio { get; set; }

    public DateTime DataFimPrevista { get; set; }

    public DateTime? DataDevolucao { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "A quilometragem inicial não pode ser negativa.")]
    public int QuilometragemInicial { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "A quilometragem final não pode ser negativa.")]
    public int? QuilometragemFinal { get; set; }

    [Range(0.01, 99999999.99, ErrorMessage = "O valor da diária deve ser maior que zero e no máximo 99.999.999,99.")]
    public decimal ValorDiaria { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DataInicio == default)
        {
            yield return new ValidationResult("A data de início é obrigatória.", new[] { nameof(DataInicio) });
        }

        if (DataFimPrevista == default)
        {
            yield return new ValidationResult("A data de fim prevista é obrigatória.", new[] { nameof(DataFimPrevista) });
        }
        else if (DataFimPrevista <= DataInicio)
        {
            yield return new ValidationResult("A data de fim prevista deve ser posterior à data de início.", new[] { nameof(DataFimPrevista) });
        }

        if (DataDevolucao.HasValue)
        {
            if (DataDevolucao < DataInicio)
            {
                yield return new ValidationResult("A data de devolução não pode ser anterior à data de início.", new[] { nameof(DataDevolucao) });
            }

            if (!QuilometragemFinal.HasValue)
            {
                yield return new ValidationResult("Informe a quilometragem final ao registrar a devolução.", new[] { nameof(QuilometragemFinal) });
            }
        }
        else if (QuilometragemFinal.HasValue)
        {
            yield return new ValidationResult("A quilometragem final só pode ser informada junto com a data de devolução.", new[] { nameof(QuilometragemFinal) });
        }

        if (QuilometragemFinal < QuilometragemInicial)
        {
            yield return new ValidationResult("A quilometragem final não pode ser inferior à quilometragem inicial.", new[] { nameof(QuilometragemFinal) });
        }
    }
}
