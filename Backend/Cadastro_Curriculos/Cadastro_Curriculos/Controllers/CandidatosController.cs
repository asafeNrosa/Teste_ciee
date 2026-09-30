using Cadastro_Curriculos.Dtos;
using CadastroCurriculos.Api.Data;
using CadastroCurriculos.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Cadastro_Curriculos.Controllers;

[ApiController]
[Route("api/candidatos")]
public class CandidatosController(AppDbContext context) : ControllerBase
{
    // GET api/candidatos
    [HttpGet]
    public async Task<ActionResult<List<CandidatoResponse>>> Listar()
    {
        var candidatos = await context.Candidatos
            .AsNoTracking()
            .OrderByDescending(c => c.DataCadastro)
            .Select(c => ParaResponse(c))
            .ToListAsync();

        return Ok(candidatos);
    }

    // GET api/candidatos/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<CandidatoResponse>> ObterPorId(int id)
    {
        var candidato = await context.Candidatos
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (candidato is null)
            return Problem(title: "Candidato não encontrado.", statusCode: StatusCodes.Status404NotFound);

        return Ok(ParaResponse(candidato));
    }

    // POST api/candidatos
    [HttpPost]
    public async Task<ActionResult<CandidatoResponse>> Cadastrar(CandidatoRequest request)
    {
        var candidato = new Candidato
        {
            NomeCompleto = request.NomeCompleto.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Telefone = LimparOpcional(request.Telefone),
            AreaInteresse = LimparOpcional(request.AreaInteresse),
            ResumoProfissional = LimparOpcional(request.ResumoProfissional)
        };

        context.Candidatos.Add(candidato);

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Problem(
                title: "Já existe um candidato cadastrado com este e-mail.",
                statusCode: StatusCodes.Status409Conflict);
        }

        return CreatedAtAction(nameof(ObterPorId), new { id = candidato.Id }, ParaResponse(candidato));
    }

    private static string? LimparOpcional(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    private static CandidatoResponse ParaResponse(Candidato c) =>
        new(c.Id, c.NomeCompleto, c.Email, c.Telefone, c.AreaInteresse, c.ResumoProfissional, c.DataCadastro);
}