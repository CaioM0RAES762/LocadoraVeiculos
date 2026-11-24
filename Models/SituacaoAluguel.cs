namespace LocadoraVeiculosApi.Models;

/// <summary>
/// Situação derivada de um aluguel: não é persistida, é calculada a partir das datas de devolução e de fim previsto.
/// </summary>
public enum SituacaoAluguel
{
    EmAndamento,
    Atrasado,
    Devolvido
}
