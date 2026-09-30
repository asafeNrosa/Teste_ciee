using System.Text.RegularExpressions;
using Cadastro_Curriculos.Dtos;

namespace Cadastro_Curriculos.Services;

public partial class CurriculoExtrator
{
    private const int LinhasAnalisadasParaNome = 10;

    private static readonly HashSet<string> TitulosIgnorados =
        ["curriculo", "currículo", "curriculum", "curriculum vitae", "resume", "résumé", "cv"];

    public DadosExtraidosResponse Extrair(string? texto)
    {
        if (string.IsNullOrWhiteSpace(texto))
            return new DadosExtraidosResponse(null, null, null);

        return new DadosExtraidosResponse(
            ExtrairNome(texto),
            ExtrairEmail(texto),
            ExtrairTelefone(texto));
    }

    private static string? ExtrairEmail(string texto)
    {
        var match = EmailRegex().Match(texto);
        return match.Success ? match.Value.ToLowerInvariant() : null;
    }

    private static string? ExtrairTelefone(string texto)
    {
        var match = TelefoneRegex().Match(texto);
        return match.Success ? match.Value.Trim() : null;
    }

    private static string? ExtrairNome(string texto)
    {
        var linhas = texto
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Take(LinhasAnalisadasParaNome);

        foreach (var linha in linhas)
        {
            if (linha.Length > 150) continue;
            if (TitulosIgnorados.Contains(linha.ToLowerInvariant())) continue;
            if (!NomeRegex().IsMatch(linha)) continue;
            if (linha.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length < 2) continue;

            return linha;
        }

        return null;
    }

    [GeneratedRegex(@"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")]
    private static partial Regex EmailRegex();

    [GeneratedRegex(@"(?<!\d)(?:\+?55[\s-]?)?\(?\d{2}\)?[\s-]?9?\d{4}[\s.-]?\d{4}(?!\d)")]
    private static partial Regex TelefoneRegex();

    [GeneratedRegex(@"^\p{L}[\p{L}' .-]*$")]
    private static partial Regex NomeRegex();
}
