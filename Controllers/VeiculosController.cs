using LocadoraVeiculosApi.Data;
using LocadoraVeiculosApi.Dtos;
using LocadoraVeiculosApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace LocadoraVeiculosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VeiculosController : ControllerBase
{
    private readonly ApplicationContext _context;

    public VeiculosController(ApplicationContext context)
    {
        _context = context;
    }

    // Filtros opcionais: ?placa=abc&modelo=onix&fabricanteId=1&categoriaId=2&disponivel=true.
    // Sem parâmetros, devolve todos os veículos (comportamento original). O campo "disponivel" da resposta é novo.
    [HttpGet]
    public async Task<IActionResult> Listar(
        [FromQuery] string? placa,
        [FromQuery] string? modelo,
        [FromQuery] int? fabricanteId,
        [FromQuery] int? categoriaId,
        [FromQuery] bool? disponivel)
    {
        var consulta = _context.Veiculos.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(placa))
        {
            var termo = placa.Replace("-", "").Trim().ToUpperInvariant();
            consulta = consulta.Where(v => v.Placa.Contains(termo));
        }

        if (!string.IsNullOrWhiteSpace(modelo))
        {
            var termo = modelo.Trim();
            consulta = consulta.Where(v => v.Modelo.Contains(termo));
        }

        if (fabricanteId.HasValue)
            consulta = consulta.Where(v => v.FabricanteId == fabricanteId.Value);

        if (categoriaId.HasValue)
            consulta = consulta.Where(v => v.CategoriaId == categoriaId.Value);

        if (disponivel == true)
            consulta = consulta.Where(v => !_context.Alugueis.Any(a => a.VeiculoId == v.Id && a.DataDevolucao == null));
        else if (disponivel == false)
            consulta = consulta.Where(v => _context.Alugueis.Any(a => a.VeiculoId == v.Id && a.DataDevolucao == null));

        var veiculos = await consulta
            .OrderBy(v => v.Modelo)
            .Select(v => new
            {
                v.Id,
                v.Placa,
                v.Modelo,
                v.AnoFabricacao,
                v.Quilometragem,
                v.FabricanteId,
                Fabricante = v.Fabricante.Nome,
                v.CategoriaId,
                Categoria = v.Categoria.Nome,
                Disponivel = !_context.Alugueis.Any(a => a.VeiculoId == v.Id && a.DataDevolucao == null)
            })
            .ToListAsync();

        return Ok(veiculos);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var veiculo = await _context.Veiculos
            .AsNoTracking()
            .Include(v => v.Fabricante)
            .Include(v => v.Categoria)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (veiculo == null)
            return NotFound(new { mensagem = "Veículo não encontrado." });

        var disponivel = !await _context.Alugueis.AnyAsync(a => a.VeiculoId == id && a.DataDevolucao == null);

        return Ok(ParaResposta(veiculo, disponivel));
    }

    [HttpGet("filtro/fabricante")]
    public async Task<IActionResult> FiltrarPorFabricante(
        [FromQuery, Required(ErrorMessage = "Informe o nome do fabricante.")] string nome)
    {
        var termo = nome.Trim();

        // INNER JOIN entre Veiculos, Fabricantes e Categorias
        var veiculos = await (from v in _context.Veiculos
                              join f in _context.Fabricantes on v.FabricanteId equals f.Id
                              join c in _context.Categorias on v.CategoriaId equals c.Id
                              where f.Nome.Contains(termo)
                              orderby f.Nome, v.Modelo
                              select new
                              {
                                  v.Id,
                                  v.Placa,
                                  v.Modelo,
                                  v.AnoFabricacao,
                                  v.Quilometragem,
                                  v.FabricanteId,
                                  Fabricante = f.Nome,
                                  v.CategoriaId,
                                  Categoria = c.Nome,
                                  Disponivel = !_context.Alugueis.Any(x => x.VeiculoId == v.Id && x.DataDevolucao == null)
                              }).ToListAsync();

        return Ok(veiculos);
    }

    [HttpGet("filtro/disponiveis")]
    public async Task<IActionResult> FiltrarDisponiveis()
    {
        // LEFT JOIN entre Veiculos e os aluguéis sem devolução: o veículo está disponível quando não há
        // aluguel em aberto correspondente. Os INNER JOINs com Fabricantes e Categorias servem para exibir os nomes.
        var veiculos = await (from v in _context.Veiculos
                              join a in _context.Alugueis.Where(x => x.DataDevolucao == null)
                                  on v.Id equals a.VeiculoId into alugueisEmAberto
                              from a in alugueisEmAberto.DefaultIfEmpty()
                              join f in _context.Fabricantes on v.FabricanteId equals f.Id
                              join c in _context.Categorias on v.CategoriaId equals c.Id
                              where a == null
                              orderby v.Modelo
                              select new
                              {
                                  v.Id,
                                  v.Placa,
                                  v.Modelo,
                                  v.AnoFabricacao,
                                  v.Quilometragem,
                                  v.FabricanteId,
                                  Fabricante = f.Nome,
                                  v.CategoriaId,
                                  Categoria = c.Nome,
                                  Disponivel = true
                              }).ToListAsync();

        return Ok(veiculos);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(VeiculoDto dto)
    {
        var veiculo = new Veiculo();

        var erro = await ValidarEPreencher(veiculo, dto);
        if (erro != null)
            return erro;

        _context.Veiculos.Add(veiculo);
        await _context.SaveChangesAsync();

        // Um veículo recém-cadastrado ainda não possui aluguéis, portanto está disponível.
        return CreatedAtAction(nameof(ObterPorId), new { id = veiculo.Id }, ParaResposta(veiculo, true));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Atualizar(int id, VeiculoDto dto)
    {
        var veiculo = await _context.Veiculos.FindAsync(id);

        if (veiculo == null)
            return NotFound(new { mensagem = "Veículo não encontrado." });

        var erro = await ValidarEPreencher(veiculo, dto);
        if (erro != null)
            return erro;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var veiculo = await _context.Veiculos.FindAsync(id);

        if (veiculo == null)
            return NotFound(new { mensagem = "Veículo não encontrado." });

        if (await _context.Alugueis.AnyAsync(a => a.VeiculoId == id))
            return Conflict(new { mensagem = "Não é possível excluir o veículo porque existem aluguéis vinculados a ele." });

        _context.Veiculos.Remove(veiculo);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<IActionResult?> ValidarEPreencher(Veiculo veiculo, VeiculoDto dto)
    {
        var fabricante = await _context.Fabricantes.FindAsync(dto.FabricanteId);
        if (fabricante == null)
            return BadRequest(new { mensagem = "O fabricante informado não existe." });

        var categoria = await _context.Categorias.FindAsync(dto.CategoriaId);
        if (categoria == null)
            return BadRequest(new { mensagem = "A categoria informada não existe." });

        var placa = dto.Placa.Replace("-", "").ToUpperInvariant();

        if (await _context.Veiculos.AnyAsync(v => v.Placa == placa && v.Id != veiculo.Id))
            return Conflict(new { mensagem = "Já existe um veículo cadastrado com esta placa." });

        veiculo.Placa = placa;
        veiculo.Modelo = dto.Modelo.Trim();
        veiculo.AnoFabricacao = dto.AnoFabricacao;
        veiculo.Quilometragem = dto.Quilometragem;
        veiculo.Fabricante = fabricante;
        veiculo.Categoria = categoria;

        return null;
    }

    private static object ParaResposta(Veiculo veiculo, bool disponivel) => new
    {
        veiculo.Id,
        veiculo.Placa,
        veiculo.Modelo,
        veiculo.AnoFabricacao,
        veiculo.Quilometragem,
        veiculo.FabricanteId,
        Fabricante = veiculo.Fabricante.Nome,
        veiculo.CategoriaId,
        Categoria = veiculo.Categoria.Nome,
        Disponivel = disponivel
    };
}
