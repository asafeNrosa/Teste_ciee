using Cadastro_Curriculos.Services;

namespace Cadastro_Curriculos.Tests;

public class CurriculoExtratorTests
{
    private readonly CurriculoExtrator _extrator = new();

    [Fact]
    public void Extrair_TextoCompleto_RetornaNomeEmailETelefone()
    {
        var texto = """
            Maria Eduarda Ferreira
            maria.ferreira@exemplo.com | (41) 98765-4321
            Curitiba - PR
            """;

        var resultado = _extrator.Extrair(texto);

        Assert.Equal("Maria Eduarda Ferreira", resultado.NomeCompleto);
        Assert.Equal("maria.ferreira@exemplo.com", resultado.Email);
        Assert.Equal("(41) 98765-4321", resultado.Telefone);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Extrair_TextoVazioOuNulo_RetornaTodosOsCamposNulos(string? texto)
    {
        var resultado = _extrator.Extrair(texto);

        Assert.Null(resultado.NomeCompleto);
        Assert.Null(resultado.Email);
        Assert.Null(resultado.Telefone);
    }

    [Fact]
    public void Extrair_SemTelefone_RetornaTelefoneNulo()
    {
        var texto = """
            João Pedro Souza
            joao.souza@exemplo.com
            """;

        var resultado = _extrator.Extrair(texto);

        Assert.Equal("joao.souza@exemplo.com", resultado.Email);
        Assert.Null(resultado.Telefone);
    }

    [Fact]
    public void Extrair_ComTituloCurriculo_IgnoraTituloEIdentificaNome()
    {
        var texto = """
            Currículo
            João Pedro Souza
            joao.souza@exemplo.com
            """;

        var resultado = _extrator.Extrair(texto);

        Assert.Equal("João Pedro Souza", resultado.NomeCompleto);
    }

    [Fact]
    public void Extrair_LinhasComEmailOuNumeroAntesDoNome_NaoSaoConsideradasNome()
    {
        var texto = """
            Contato: joao.souza@exemplo.com
            Tel: 41 99999-0000
            João Pedro Souza
            """;

        var resultado = _extrator.Extrair(texto);

        Assert.Equal("João Pedro Souza", resultado.NomeCompleto);
    }

    [Fact]
    public void Extrair_EmailEmMaiusculas_RetornaEmMinusculas()
    {
        var resultado = _extrator.Extrair("E-mail: JOAO.SOUZA@EXEMPLO.COM");

        Assert.Equal("joao.souza@exemplo.com", resultado.Email);
    }

    [Theory]
    [InlineData("(41) 99999-0000")]
    [InlineData("41 99999-0000")]
    [InlineData("+55 41 99999-0000")]
    [InlineData("41999990000")]
    [InlineData("(41) 3333-4444")]
    public void Extrair_FormatosComunsDeTelefone_Reconhece(string telefone)
    {
        var resultado = _extrator.Extrair($"Telefone: {telefone}");

        Assert.Equal(telefone, resultado.Telefone);
    }

    [Fact]
    public void Extrair_Cpf_NaoConfundeComTelefone()
    {
        var resultado = _extrator.Extrair("CPF: 123.456.789-00");

        Assert.Null(resultado.Telefone);
    }
}