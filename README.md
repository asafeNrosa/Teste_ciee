# Cadastro de Currículos

Aplicação para a equipe de recrutamento cadastrar e consultar candidatos, desenvolvida como desafio técnico para o CIEE/PR.

O cadastro pode ser feito de duas formas, pelo **mesmo formulário e com as mesmas regras de validação**:

- **Manual:** a pessoa preenche os dados e salva.
- **Com PDF:** a pessoa envia um currículo (opcional, até 5 MB), o backend extrai o texto e tenta identificar **nome, e-mail e telefone**. Os dados encontrados preenchem o formulário e podem ser corrigidos antes de salvar.

Depois de salvo, o candidato aparece na listagem, com acesso a uma tela de detalhes.

O relato do desenvolvimento, as decisões técnicas e o uso de IA estão em [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md).

---

## Tecnologias e versões

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | Angular (componentes standalone, signals, zoneless) | 21.2.x |
| Frontend | Bootstrap (customizado via Sass) | 5.3.8 |
| Backend | ASP.NET Core Web API | .NET 10 |
| Backend | Entity Framework Core (SqlServer, Design, Tools) | 10.0.12 |
| Backend | PdfPig (leitura de PDF) | 0.1.16 |
| Banco de dados | SQL Server Express | 2025 (17.0) |
| Testes | xUnit / xunit.runner.visualstudio / Microsoft.NET.Test.Sdk | 2.9.3 / 3.1.4 / 17.14.1 |

Ambiente usado no desenvolvimento: Windows, Visual Studio 2026 (18.10), Node.js 24.13, npm 11.6, Angular CLI 21.2.

---

## Estrutura do repositório

```
├── Backend/
│   └── Cadastro_Curriculos/
│       ├── Cadastro_Curriculos/          # API ASP.NET Core
│       │   ├── Controllers/              # CandidatosController, CurriculosController
│       │   ├── Data/                     # AppDbContext
│       │   ├── Dtos/                     # Request e Response
│       │   ├── Infrastructure/           # GlobalExceptionHandler
│       │   ├── Migrations/               # Estrutura do banco (EF Core)
│       │   ├── Models/                   # Entidade Candidato
│       │   ├── Services/                 # LeitorPdf, CurriculoExtrator
│       │   ├── appsettings.example.json  # Modelo de configuração
│       │   └── Cadastro_Curriculos.http  # Requisições para teste manual
│       └── Cadastro_Curriculos.Tests/    # Testes automatizados (xUnit)
├── Frontend/
│   └── cadastro-curriculos/              # Aplicação Angular
├── exemplos/
│   └── curriculo.pdf                     # Currículo fictício para testar a importação
├── DESENVOLVIMENTO.md
└── README.md
```

---

## Pré-requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) 20.19 ou superior (desenvolvido com a 24.13)
- Angular CLI 21: `npm install -g @angular/cli`
- SQL Server (Express, Developer ou LocalDB)
- Ferramenta de migrations do EF Core: `dotnet tool install --global dotnet-ef`

---

## 1. Configurar a conexão com o SQL Server

A connection string **não fica no repositório**. O arquivo `appsettings.example.json` mostra o formato esperado:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.\\SQLEXPRESS;Database=CadastroCurriculos;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

Ajuste o `Server=` para a sua instância. Exemplos: `.\SQLEXPRESS` (Express), `localhost` (instância padrão), `(localdb)\MSSQLLocalDB` (LocalDB). Para autenticação SQL, troque `Trusted_Connection=True` por `User Id=...;Password=...`.

Escolha **uma** das formas de configurar:

**Opção A: User Secrets (recomendada)**, na pasta da API:

```bash
cd Backend/Cadastro_Curriculos/Cadastro_Curriculos
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=.\SQLEXPRESS;Database=CadastroCurriculos;Trusted_Connection=True;TrustServerCertificate=True"
```

**Opção B: arquivo local**, copiando o exemplo para `appsettings.Development.json` na mesma pasta e ajustando a string.

**Opção C: variável de ambiente** `ConnectionStrings__DefaultConnection`.

Se a connection string não for encontrada, a API não inicia e mostra uma mensagem indicando o problema.

---

## 2. Criar a estrutura do banco

O banco `CadastroCurriculos` é criado automaticamente pelas migrations, se ainda não existir:

```bash
cd Backend/Cadastro_Curriculos/Cadastro_Curriculos
dotnet ef database update
```

No Visual Studio, o equivalente é rodar `Update-Database` no Package Manager Console, com o projeto `Cadastro_Curriculos` selecionado.

A estrutura criada é uma tabela `Candidatos`, com índice único no e-mail e data de cadastro preenchida pelo banco, em UTC.

---

## 3. Executar a aplicação

São dois terminais: um para a API e outro para o frontend.

**Backend (API):**

```bash
cd Backend/Cadastro_Curriculos/Cadastro_Curriculos
dotnet run --launch-profile http
```

A API fica disponível em `http://localhost:5006`.

**Frontend:**

```bash
cd Frontend/cadastro-curriculos
npm install
ng serve
```

Acesse `http://localhost:4200`.

Se a API rodar em outra porta, ajuste `apiUrl` em `Frontend/cadastro-curriculos/src/environments/environment.development.ts`. Se o frontend rodar em outra origem, acrescente-a em `Cors:Origens` no `appsettings` da API.

Para testar a importação, use o currículo fictício em `exemplos/curriculo.pdf`.

---

## 4. Rodar os testes

```bash
cd Backend/Cadastro_Curriculos
dotnet test
```

Os testes automatizados cobrem:

- **CurriculoExtratorTests:** identificação de nome, e-mail e telefone, incluindo casos de confusão (título antes do nome, linhas de contato, CPF parecido com telefone).
- **CandidatoRequestValidacaoTests:** campos obrigatórios, tamanho máximo e formato do e-mail, conferindo as mensagens.
- **LeitorPdfTests:** validação do arquivo (ausente, vazio, acima de 5 MB, extensão errada, arquivo renomeado) e tratamento de PDF corrompido.

Para testes manuais da API, o arquivo `Cadastro_Curriculos.http` pode ser executado pelo Visual Studio ou pelo VS Code (extensão REST Client). O upload pode ser testado com curl:

```bash
curl -i -F "arquivo=@exemplos/curriculo.pdf" http://localhost:5006/api/curriculos/extrair
```

No PowerShell, use `curl.exe` em vez de `curl`.

---

## Endpoints da API

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| GET | `/api/candidatos` | Lista os candidatos, mais recentes primeiro | 200 |
| GET | `/api/candidatos/{id}` | Detalhes de um candidato | 200, 404 |
| POST | `/api/candidatos` | Cadastra um candidato | 201, 400, 409 |
| POST | `/api/curriculos/extrair` | Lê o PDF (campo `arquivo`, multipart) e devolve os dados encontrados, sem salvar | 200, 400, 413, 422 |

Todos os erros seguem o formato ProblemDetails (RFC 9457). Erros inesperados retornam 500, e falhas de conexão com o banco retornam 503.

---

## Validações

| Campo | Regra |
|---|---|
| Nome completo | Obrigatório (não aceita só espaços), até 150 caracteres |
| E-mail | Obrigatório, formato válido, até 254 caracteres, único no cadastro |
| Telefone | Opcional, até 20 caracteres |
| Área ou cargo de interesse | Opcional, até 100 caracteres |
| Resumo profissional | Opcional, até 2000 caracteres |
| Arquivo | Opcional; PDF de até 5 MB, conferido pela extensão e pela assinatura `%PDF-` |

As mesmas regras são aplicadas no frontend, para resposta imediata, e no backend, que é a garantia final.

---

## Limitações conhecidas

- O nome é identificado por heurística: se um cargo aparecer na primeira linha do currículo, pode ser confundido com o nome.
- Havendo mais de um e-mail ou telefone, só o primeiro é capturado.
- Telefones fora do padrão brasileiro não são reconhecidos.
- PDFs escaneados (imagem) não são lidos, porque não há OCR.
- Área de interesse e resumo não são extraídos do PDF.

Em todos os casos, o formulário permite completar ou corrigir os dados antes de salvar. Detalhes e melhorias planejadas estão no [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md).
