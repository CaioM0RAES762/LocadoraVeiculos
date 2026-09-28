using LocadoraVeiculosApi.Data;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

var app = builder.Build();

// Erros SQL 547 (FK/CHECK), 2601 e 2627 (índice único) que escaparem das verificações dos controllers viram 409.
app.UseExceptionHandler(erro => erro.Run(async context =>
{
    var excecao = context.Features.Get<IExceptionHandlerFeature>()?.Error;

    if (excecao is DbUpdateException { InnerException: SqlException { Number: 547 or 2601 or 2627 } })
    {
        context.Response.StatusCode = StatusCodes.Status409Conflict;
        await context.Response.WriteAsJsonAsync(new { mensagem = "A operação viola uma restrição de integridade do banco de dados." });
        return;
    }

    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await context.Response.WriteAsJsonAsync(new { mensagem = "Ocorreu um erro inesperado ao processar a requisição." });
}));

app.MapControllers();

app.Run();
