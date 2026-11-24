using LocadoraVeiculosApi.Data;
using LocadoraVeiculosApi.Dtos;
using LocadoraVeiculosApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocadoraVeiculosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FabricantesController : ControllerBase
{
    private readonly ApplicationContext _context;

    public FabricantesController(ApplicationContext context)
    {
        _context = context;
    }

    // Filtros opcionais: ?id=1&nome=ford. Sem parâmetros, devolve todos os fabricantes (comportamento original).
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] int? id, [FromQuery] string? nome)
    {
        var consulta = _context.Fabricantes.AsNoTracking().AsQueryable();

        if (id.HasValue)
            consulta = consulta.Where(f => f.Id == id.Value);

        if (!string.IsNullOrWhiteSpace(nome))
        {
            var termo = nome.Trim();
            consulta = consulta.Where(f => f.Nome.Contains(termo));
        }

        var fabricantes = await consulta
            .OrderBy(f => f.Nome)
            .ToListAsync();

        return Ok(fabricantes.Select(ParaResposta));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var fabricante = await _context.Fabricantes.FindAsync(id);

        if (fabricante == null)
            return NotFound(new { mensagem = "Fabricante não encontrado." });

        return Ok(ParaResposta(fabricante));
    }

    [HttpPost]
    public async Task<IActionResult> Criar(FabricanteDto dto)
    {
        var nome = dto.Nome.Trim();

        if (await _context.Fabricantes.AnyAsync(f => f.Nome == nome))
            return Conflict(new { mensagem = "Já existe um fabricante com este nome." });

        var fabricante = new Fabricante { Nome = nome };

        _context.Fabricantes.Add(fabricante);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = fabricante.Id }, ParaResposta(fabricante));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Atualizar(int id, FabricanteDto dto)
    {
        var fabricante = await _context.Fabricantes.FindAsync(id);

        if (fabricante == null)
            return NotFound(new { mensagem = "Fabricante não encontrado." });

        var nome = dto.Nome.Trim();

        if (await _context.Fabricantes.AnyAsync(f => f.Nome == nome && f.Id != id))
            return Conflict(new { mensagem = "Já existe um fabricante com este nome." });

        fabricante.Nome = nome;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var fabricante = await _context.Fabricantes.FindAsync(id);

        if (fabricante == null)
            return NotFound(new { mensagem = "Fabricante não encontrado." });

        if (await _context.Veiculos.AnyAsync(v => v.FabricanteId == id))
            return Conflict(new { mensagem = "Não é possível excluir o fabricante porque existem veículos vinculados a ele." });

        _context.Fabricantes.Remove(fabricante);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static object ParaResposta(Fabricante fabricante) => new
    {
        fabricante.Id,
        fabricante.Nome
    };
}
