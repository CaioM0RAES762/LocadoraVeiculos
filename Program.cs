using LocadoraVeiculosApi.Data;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

builder.Services.AddSwaggerGen(options =>
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Locadora de Veículos API", Version = "v1" }));

// CORS restrito às origens do frontend listadas em "Cors:AllowedOrigins" (appsettings.json).
// No desenvolvimento o proxy do Vite dispensa CORS; a política vale quando o frontend chama a API diretamente.
const string PoliticaFrontend = "Frontend";
var origensPermitidas = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
    options.AddPolicy(PoliticaFrontend, politica => politica
        .WithOrigins(origensPermitidas)
        .WithMethods("GET", "POST", "PUT", "DELETE")
        .WithHeaders("Content-Type")));

var app = builder.Build();

// Erros SQL 547 (FK/CHECK), 2601 e 2627 (índice único) que escaparem das verificações dos controllers viram 409.
app.UseExceptionHandler(erro => erro.Run(async context =>
{
    var excecao = context.Features.Get<IExceptionHandlerFeature>()?.Error;

    // O tratador de exceções limpa os cabeçalhos da resposta; reaplica o CORS para o frontend ler a mensagem de erro.
    var corsService = context.RequestServices.GetRequiredService<ICorsService>();
    var corsPolicy = await context.RequestServices.GetRequiredService<ICorsPolicyProvider>().GetPolicyAsync(context, PoliticaFrontend);
    if (corsPolicy != null)
        corsService.ApplyResult(corsService.EvaluatePolicy(context, corsPolicy), context.Response);

    if (excecao is DbUpdateException { InnerException: SqlException { Number: 547 or 2601 or 2627 } })
    {
        context.Response.StatusCode = StatusCodes.Status409Conflict;
        await context.Response.WriteAsJsonAsync(new { mensagem = "A operação viola uma restrição de integridade do banco de dados." });
        return;
    }

    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await context.Response.WriteAsJsonAsync(new { mensagem = "Ocorreu um erro inesperado ao processar a requisição." });
}));

app.UseCors(PoliticaFrontend);

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();
