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

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var veiculos = await _context.Veiculos
            .AsNoTracking()
            .Include(v => v.Fabricante)
            .Include(v => v.Categoria)
            .OrderBy(v => v.Modelo)
            .ToListAsync();

        return Ok(veiculos.Select(ParaResposta));
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

        return Ok(ParaResposta(veiculo));
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
                                  Categoria = c.Nome
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
                                  Categoria = c.Nome
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

        return CreatedAtAction(nameof(ObterPorId), new { id = veiculo.Id }, ParaResposta(veiculo));
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

    private static object ParaResposta(Veiculo veiculo) => new
    {
        veiculo.Id,
        veiculo.Placa,
        veiculo.Modelo,
        veiculo.AnoFabricacao,
        veiculo.Quilometragem,
        veiculo.FabricanteId,
        Fabricante = veiculo.Fabricante.Nome,
        veiculo.CategoriaId,
        Categoria = veiculo.Categoria.Nome
    };
}
