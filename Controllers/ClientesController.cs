using LocadoraVeiculosApi.Data;
using LocadoraVeiculosApi.Dtos;
using LocadoraVeiculosApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LocadoraVeiculosApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly ApplicationContext _context;

    public ClientesController(ApplicationContext context)
    {
        _context = context;
    }

    // Filtros opcionais: ?nome=ana&cpf=123&email=exemplo. Sem parâmetros, devolve todos os clientes (comportamento original).
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? nome, [FromQuery] string? cpf, [FromQuery] string? email)
    {
        var consulta = _context.Clientes.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(nome))
        {
            var termo = nome.Trim();
            consulta = consulta.Where(c => c.Nome.Contains(termo));
        }

        if (!string.IsNullOrWhiteSpace(cpf))
        {
            // O CPF é armazenado apenas com dígitos; pontos e traço digitados na busca são ignorados.
            var digitos = new string(cpf.Where(char.IsDigit).ToArray());
            consulta = consulta.Where(c => c.Cpf.Contains(digitos));
        }

        if (!string.IsNullOrWhiteSpace(email))
        {
            var termo = email.Trim();
            consulta = consulta.Where(c => c.Email.Contains(termo));
        }

        var clientes = await consulta
            .OrderBy(c => c.Nome)
            .ToListAsync();

        return Ok(clientes.Select(ParaResposta));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var cliente = await _context.Clientes.FindAsync(id);

        if (cliente == null)
            return NotFound(new { mensagem = "Cliente não encontrado." });

        return Ok(ParaResposta(cliente));
    }

    [HttpGet("filtro/sem-alugueis")]
    public async Task<IActionResult> FiltrarSemAlugueis()
    {
        // LEFT JOIN entre Clientes e Alugueis: os clientes sem nenhum aluguel correspondente ficam com "a" nulo.
        var clientes = await (from c in _context.Clientes
                              join a in _context.Alugueis on c.Id equals a.ClienteId into alugueis
                              from a in alugueis.DefaultIfEmpty()
                              where a == null
                              orderby c.Nome
                              select new
                              {
                                  c.Id,
                                  c.Nome,
                                  c.Cpf,
                                  c.Email
                              }).ToListAsync();

        return Ok(clientes);
    }

    [HttpPost]
    public async Task<IActionResult> Criar(ClienteDto dto)
    {
        var cliente = new Cliente();

        var erro = await ValidarEPreencher(cliente, dto);
        if (erro != null)
            return erro;

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObterPorId), new { id = cliente.Id }, ParaResposta(cliente));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Atualizar(int id, ClienteDto dto)
    {
        var cliente = await _context.Clientes.FindAsync(id);

        if (cliente == null)
            return NotFound(new { mensagem = "Cliente não encontrado." });

        var erro = await ValidarEPreencher(cliente, dto);
        if (erro != null)
            return erro;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var cliente = await _context.Clientes.FindAsync(id);

        if (cliente == null)
            return NotFound(new { mensagem = "Cliente não encontrado." });

        if (await _context.Alugueis.AnyAsync(a => a.ClienteId == id))
            return Conflict(new { mensagem = "Não é possível excluir o cliente porque existem aluguéis vinculados a ele." });

        _context.Clientes.Remove(cliente);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<IActionResult?> ValidarEPreencher(Cliente cliente, ClienteDto dto)
    {
        var email = dto.Email.Trim();

        if (await _context.Clientes.AnyAsync(c => c.Cpf == dto.Cpf && c.Id != cliente.Id))
            return Conflict(new { mensagem = "Já existe um cliente cadastrado com este CPF." });

        if (await _context.Clientes.AnyAsync(c => c.Email == email && c.Id != cliente.Id))
            return Conflict(new { mensagem = "Já existe um cliente cadastrado com este e-mail." });

        cliente.Nome = dto.Nome.Trim();
        cliente.Cpf = dto.Cpf;
        cliente.Email = email;

        return null;
    }

    private static object ParaResposta(Cliente cliente) => new
    {
        cliente.Id,
        cliente.Nome,
        cliente.Cpf,
        cliente.Email
    };
}
