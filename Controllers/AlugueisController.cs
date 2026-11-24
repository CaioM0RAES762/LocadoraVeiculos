using LocadoraVeiculosApi.Data;
using LocadoraVeiculosApi.Dtos;
using LocadoraVeiculosApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;

namespace LocadoraVeiculosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AlugueisController : ControllerBase
{
    private const decimal ValorMaximo = 99999999.99m;

    private readonly ApplicationContext _context;

    public AlugueisController(ApplicationContext context)
    {
        _context = context;
    }

    // Filtros opcionais: ?clienteId=1&veiculoId=2&situacao=Atrasado&inicio=2026-01-01&fim=2026-01-31.
    // Sem parâmetros, devolve todos os aluguéis (comportamento original). O campo "situacao" da resposta é novo.
    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] int? clienteId,
        [FromQuery] int? veiculoId,
        [FromQuery] string? situacao,
        [FromQuery] DateTime? inicio,
        [FromQuery] DateTime? fim)
    {
        SituacaoAluguel? situacaoFiltro = null;

        if (!string.IsNullOrWhiteSpace(situacao))
        {
            if (!Enum.TryParse<SituacaoAluguel>(situacao.Trim(), ignoreCase: true, out var valor) || !Enum.IsDefined(valor))
                return BadRequest(new { mensagem = "A situação informada é inválida. Use EmAndamento, Atrasado ou Devolvido." });

            situacaoFiltro = valor;
        }

        if (inicio.HasValue && fim.HasValue && fim.Value.Date < inicio.Value.Date)
            return BadRequest(new { mensagem = "A data final do período não pode ser anterior à data inicial." });

        var agora = DateTime.Now;

        var consulta = _context.Alugueis
            .AsNoTracking()
            .Include(a => a.Cliente)
            .Include(a => a.Veiculo)
            .AsQueryable();

        if (clienteId.HasValue)
            consulta = consulta.Where(a => a.ClienteId == clienteId.Value);

        if (veiculoId.HasValue)
            consulta = consulta.Where(a => a.VeiculoId == veiculoId.Value);

        // O período considera a data de início do aluguel, igual à rota /filtro/periodo.
        if (inicio.HasValue)
        {
            var dataInicial = inicio.Value.Date;
            consulta = consulta.Where(a => a.DataInicio >= dataInicial);
        }

        if (fim.HasValue)
        {
            var dataFinalExclusiva = fim.Value.Date.AddDays(1);
            consulta = consulta.Where(a => a.DataInicio < dataFinalExclusiva);
        }

        consulta = situacaoFiltro switch
        {
            SituacaoAluguel.Devolvido => consulta.Where(a => a.DataDevolucao != null),
            SituacaoAluguel.Atrasado => consulta.Where(a => a.DataDevolucao == null && a.DataFimPrevista < agora),
            SituacaoAluguel.EmAndamento => consulta.Where(a => a.DataDevolucao == null && a.DataFimPrevista >= agora),
            _ => consulta
        };

        var alugueis = await consulta
            .OrderByDescending(a => a.DataInicio)
            .ToListAsync();

        return Ok(alugueis.Select(a => ParaResposta(a, agora)));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var aluguel = await _context.Alugueis
            .AsNoTracking()
            .Include(a => a.Cliente)
            .Include(a => a.Veiculo)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (aluguel == null)
            return NotFound(new { mensagem = "Aluguel não encontrado." });

        return Ok(ParaResposta(aluguel, DateTime.Now));
    }

    [HttpGet("filtro/cliente/{clienteId:int}")]
    public async Task<IActionResult> FiltrarPorCliente(int clienteId)
    {
        if (!await _context.Clientes.AnyAsync(c => c.Id == clienteId))
            return NotFound(new { mensagem = "Cliente não encontrado." });

        var agora = DateTime.Now;

        // INNER JOIN entre Alugueis, Veiculos e Fabricantes
        var alugueis = await (from a in _context.Alugueis
                              join v in _context.Veiculos on a.VeiculoId equals v.Id
                              join f in _context.Fabricantes on v.FabricanteId equals f.Id
                              where a.ClienteId == clienteId
                              orderby a.DataInicio descending
                              select new
                              {
                                  a.Id,
                                  a.VeiculoId,
                                  v.Placa,
                                  v.Modelo,
                                  Fabricante = f.Nome,
                                  a.DataInicio,
                                  a.DataFimPrevista,
                                  a.DataDevolucao,
                                  a.QuilometragemInicial,
                                  a.QuilometragemFinal,
                                  a.ValorDiaria,
                                  a.ValorTotal,
                                  Situacao = a.DataDevolucao != null
                                      ? nameof(SituacaoAluguel.Devolvido)
                                      : a.DataFimPrevista < agora
                                          ? nameof(SituacaoAluguel.Atrasado)
                                          : nameof(SituacaoAluguel.EmAndamento)
                              }).ToListAsync();

        return Ok(alugueis);
    }

    [HttpGet("filtro/periodo")]
    public async Task<IActionResult> FiltrarPorPeriodo([FromQuery, BindRequired] DateTime inicio, [FromQuery, BindRequired] DateTime fim)
    {
        if (fim.Date < inicio.Date)
            return BadRequest(new { mensagem = "A data final do período não pode ser anterior à data inicial." });

        var dataInicial = inicio.Date;
        var dataFinalExclusiva = fim.Date.AddDays(1);
        var agora = DateTime.Now;

        // INNER JOIN entre Alugueis, Clientes e Veiculos
        var alugueis = await (from a in _context.Alugueis
                              join c in _context.Clientes on a.ClienteId equals c.Id
                              join v in _context.Veiculos on a.VeiculoId equals v.Id
                              where a.DataInicio >= dataInicial && a.DataInicio < dataFinalExclusiva
                              orderby a.DataInicio
                              select new
                              {
                                  a.Id,
                                  a.ClienteId,
                                  Cliente = c.Nome,
                                  a.VeiculoId,
                                  v.Placa,
                                  v.Modelo,
                                  a.DataInicio,
                                  a.DataFimPrevista,
                                  a.DataDevolucao,
                                  a.ValorDiaria,
                                  a.ValorTotal,
                                  Situacao = a.DataDevolucao != null
                                      ? nameof(SituacaoAluguel.Devolvido)
                                      : a.DataFimPrevista < agora
                                          ? nameof(SituacaoAluguel.Atrasado)
                                          : nameof(SituacaoAluguel.EmAndamento)
                              }).ToListAsync();

        return Ok(alugueis);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(AluguelDto dto)
    {
        var aluguel = new Aluguel();

        var erro = await ValidarEPreencher(aluguel, dto);
        if (erro != null)
            return erro;

        _context.Alugueis.Add(aluguel);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = aluguel.Id }, ParaResposta(aluguel, DateTime.Now));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Atualizar(int id, AluguelDto dto)
    {
        var aluguel = await _context.Alugueis.FindAsync(id);

        if (aluguel == null)
            return NotFound(new { mensagem = "Aluguel não encontrado." });

        var erro = await ValidarEPreencher(aluguel, dto);
        if (erro != null)
            return erro;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var aluguel = await _context.Alugueis.FindAsync(id);

        if (aluguel == null)
            return NotFound(new { mensagem = "Aluguel não encontrado." });

        _context.Alugueis.Remove(aluguel);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<IActionResult?> ValidarEPreencher(Aluguel aluguel, AluguelDto dto)
    {
        var cliente = await _context.Clientes.FindAsync(dto.ClienteId);
        if (cliente == null)
            return BadRequest(new { mensagem = "O cliente informado não existe." });

        var veiculo = await _context.Veiculos.FindAsync(dto.VeiculoId);
        if (veiculo == null)
            return BadRequest(new { mensagem = "O veículo informado não existe." });

        if (dto.DataDevolucao == null)
        {
            var veiculoOcupado = await _context.Alugueis.AnyAsync(a =>
                a.VeiculoId == dto.VeiculoId && a.DataDevolucao == null && a.Id != aluguel.Id);

            if (veiculoOcupado)
                return Conflict(new { mensagem = "O veículo informado já possui um aluguel em andamento." });
        }

        decimal? valorTotal = null;

        if (dto.DataDevolucao.HasValue)
        {
            // Cada dia iniciado é cobrado como uma diária completa, com no mínimo uma diária.
            var diarias = Math.Max(1, (int)Math.Ceiling((dto.DataDevolucao.Value - dto.DataInicio).TotalDays));
            valorTotal = diarias * dto.ValorDiaria;

            if (valorTotal > ValorMaximo)
                return BadRequest(new { mensagem = "O valor total calculado para a locação excede o limite permitido." });
        }

        aluguel.Cliente = cliente;
        aluguel.Veiculo = veiculo;
        aluguel.DataInicio = dto.DataInicio;
        aluguel.DataFimPrevista = dto.DataFimPrevista;
        aluguel.DataDevolucao = dto.DataDevolucao;
        aluguel.QuilometragemInicial = dto.QuilometragemInicial;
        aluguel.QuilometragemFinal = dto.QuilometragemFinal;
        aluguel.ValorDiaria = dto.ValorDiaria;
        aluguel.ValorTotal = valorTotal;

        return null;
    }

    private static string CalcularSituacao(Aluguel aluguel, DateTime agora)
    {
        if (aluguel.DataDevolucao.HasValue)
            return nameof(SituacaoAluguel.Devolvido);

        return aluguel.DataFimPrevista < agora
            ? nameof(SituacaoAluguel.Atrasado)
            : nameof(SituacaoAluguel.EmAndamento);
    }

    private static object ParaResposta(Aluguel aluguel, DateTime agora) => new
    {
        aluguel.Id,
        aluguel.ClienteId,
        Cliente = aluguel.Cliente.Nome,
        aluguel.VeiculoId,
        aluguel.Veiculo.Placa,
        aluguel.Veiculo.Modelo,
        aluguel.DataInicio,
        aluguel.DataFimPrevista,
        aluguel.DataDevolucao,
        aluguel.QuilometragemInicial,
        aluguel.QuilometragemFinal,
        aluguel.ValorDiaria,
        aluguel.ValorTotal,
        Situacao = CalcularSituacao(aluguel, agora)
    };
}
