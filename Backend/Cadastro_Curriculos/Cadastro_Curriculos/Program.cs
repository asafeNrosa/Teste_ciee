using Cadastro_Curriculos.Infrastructure;
using Cadastro_Curriculos.Services;
using CadastroCurriculos.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' não encontrada. Configure-a via User Secrets ou appsettings.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddSingleton<CurriculoExtrator>();
builder.Services.AddSingleton<LeitorPdf>();

const string PoliticaFrontend = "Frontend";

builder.Services.AddCors(options =>
    options.AddPolicy(PoliticaFrontend, policy =>
        policy.WithOrigins(builder.Configuration.GetSection("Cors:Origens").Get<string[]>()
                           ?? ["http://localhost:4200"])
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseExceptionHandler();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(PoliticaFrontend);

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
