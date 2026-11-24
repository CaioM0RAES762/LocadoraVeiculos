using LocadoraVeiculosApi.Data;
using LocadoraVeiculosApi.Dtos;
using LocadoraVeiculosApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocadoraVeiculosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriasController : ControllerBase
{
    private readonly ApplicationContext _context;

    public CategoriasController(ApplicationContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        var categorias = await _context.Categorias
            .AsNoTracking()
            .OrderBy(c => c.Nome)
            .ToListAsync();

        return Ok(categorias.Select(ParaResposta));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var categoria = await _context.Categorias.FindAsync(id);

        if (categoria == null)
            return NotFound(new { mensagem = "Categoria não encontrada." });

        return Ok(ParaResposta(categoria));
    }

    [HttpPost]
    public async Task<IActionResult> Criar(CategoriaDto dto)
    {
        var nome = dto.Nome.Trim();

        if (await _context.Categorias.AnyAsync(c => c.Nome == nome))
            return Conflict(new { mensagem = "Já existe uma categoria com este nome." });

        var categoria = new Categoria { Nome = nome };

        _context.Categorias.Add(categoria);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = categoria.Id }, ParaResposta(categoria));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Atualizar(int id, CategoriaDto dto)
    {
        var categoria = await _context.Categorias.FindAsync(id);

        if (categoria == null)
            return NotFound(new { mensagem = "Categoria não encontrada." });

        var nome = dto.Nome.Trim();

        if (await _context.Categorias.AnyAsync(c => c.Nome == nome && c.Id != id))
            return Conflict(new { mensagem = "Já existe uma categoria com este nome." });

        categoria.Nome = nome;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var categoria = await _context.Categorias.FindAsync(id);

        if (categoria == null)
            return NotFound(new { mensagem = "Categoria não encontrada." });

        if (await _context.Veiculos.AnyAsync(v => v.CategoriaId == id))
            return Conflict(new { mensagem = "Não é possível excluir a categoria porque existem veículos vinculados a ela." });

        _context.Categorias.Remove(categoria);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static object ParaResposta(Categoria categoria) => new
    {
        categoria.Id,
        categoria.Nome
    };
}
