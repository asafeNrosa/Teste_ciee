# Relato do desenvolvimento

Este documento descreve como organizei o trabalho, as decisões técnicas, o uso de inteligência artificial, o que precisei corrigir, como verifiquei a solução, o tempo dedicado e as limitações e melhorias que faria com mais tempo.

---

## 1. Organização e execução

Priorizei uma entrega funcional e completa, como o próprio desafio sugere. O plano foi dividido em duas frentes:

1. **Backend completo e testado primeiro:** modelagem do banco, API de candidatos, extração de dados do PDF e testes automatizados.
2. **Depois, frontend, integração e documentação:** wireframe, telas em Angular, ajustes de integração, README e este relato.

Cada etapa terminava com testes manuais e um commit, para que o histórico mostrasse a evolução do trabalho. Durante o desenvolvimento, mantive anotações das etapas, que depois comparei com o que foi executado para montar este documento.

Ferramentas: Visual Studio 2026 (backend), VS Code (frontend), SQL Server Management Studio, Git e GitHub, arquivo `.http` do Visual Studio e `curl` para testar a API.

---

## 2. Principais decisões técnicas

### Banco de dados

- **Uma única tabela `Candidatos`.** Minha primeira ideia foi criar uma tabela para cada campo do formulário. Revisei a decisão: os campos são atributos de um único candidato, com um valor cada, e a tabela única já está normalizada. Separar exigiria vários INSERTs e JOINs sem nenhum ganho.
- **Índice único no e-mail**, para impedir cadastros duplicados. A regra fica no banco porque ele é o único ponto por onde todas as gravações passam, inclusive as simultâneas.
- **Data de cadastro preenchida pelo próprio banco**, em UTC (`SYSUTCDATETIME()`).
- **Telefone como texto**, para preservar a formatação.
- **O PDF não é armazenado:** ele só é lido para preencher o formulário.
- **Estrutura criada com migrations do EF Core** (Code First), versionadas junto com o código.

### Backend (ASP.NET Core)

- **DTOs separados da entidade.** O `CandidatoRequest` não aceita `Id` nem `DataCadastro`, e o `CandidatoResponse` define exatamente o que a API devolve.
- **Validação com Data Annotations** e mensagens em português, aplicadas automaticamente pelo `[ApiController]`. O e-mail é validado por uma expressão regular, porque o `[EmailAddress]` do .NET aceita endereços como `joao@empresa`.
- **Erros no formato ProblemDetails**, com códigos HTTP consistentes: 400, 404, 409, 413, 422, 500 e 503.
- **Tratamento de erros em dois níveis:** try/catch apenas onde o erro é esperado e tratável (e-mail duplicado, filtrando as violações 2601 e 2627 do SQL Server, e falha na leitura do PDF), e um tratador global (`IExceptionHandler`) para os erros inesperados. Detalhes técnicos vão só para o log, nunca para o usuário.
- **E-mail duplicado tratado pela violação do índice**, sem consulta prévia, para evitar condição de corrida entre requisições simultâneas.
- **Leitura e extração separadas.** O `LeitorPdf` cuida do arquivo, e o `CurriculoExtrator` cuida do texto. Assim o extrator é testado apenas com strings, sem precisar de PDFs.
- **Validação do arquivo em camadas:** presença, tamanho até 5 MB, extensão e assinatura `%PDF-` nos primeiros bytes. A assinatura impede que um arquivo renomeado seja aceito.
- **Extração:** e-mail e telefone por expressões regulares. O nome é identificado por heurística: a primeira linha, entre as dez primeiras, só com letras e com pelo menos duas palavras, ignorando títulos como "Currículo".
- **O endpoint de extração não salva nada.** Os dois caminhos de cadastro terminam no mesmo `POST /api/candidatos`, com as mesmas validações.
- **Configuração sem credenciais no repositório:** connection string no User Secrets, com autenticação do Windows, e um `appsettings.example.json` como modelo.
- **Redirecionamento HTTPS apenas fora do ambiente de desenvolvimento**, porque o navegador não aceita redirecionamentos na verificação de CORS (preflight), o que quebraria o upload pelo frontend.

### Frontend (Angular)

- **Wireframe próprio como base**, com ajustes antes de codar: rótulos acima dos campos (o placeholder desapareceria quando o PDF preenchesse o formulário), botões Salvar e Cancelar, área de mensagens, dados da tela de detalhes como texto e um cabeçalho de navegação.
- **Bootstrap customizado via Sass**, com uma paleta de cores vivas e contraste adequado para leitura. Campos preenchidos pelo PDF ficam destacados em ciano, para o usuário saber o que conferir.
- **Um único formulário (Reactive Forms) para os dois caminhos.** O PDF apenas preenche os campos encontrados, que podem ser corrigidos antes de salvar.
- **Mesmas regras de validação do backend:** a mesma expressão regular de e-mail e um validador de obrigatório que, como o `[Required]` do .NET, recusa textos só com espaços.
- **O PDF nunca bloqueia o cadastro manual.** Arquivo inválido, falha de leitura ou API indisponível geram apenas uma mensagem.
- **Erros da API ligados aos campos:** o 409 aparece no campo e-mail, e os erros de validação do backend (400) aparecem em cada campo correspondente.
- **Estado das telas em signals**, necessário no Angular 21, que funciona sem Zone.js por padrão.
- **Todas as chamadas HTTP num único serviço** (`CandidatoService`) e o tratamento de mensagens de erro numa função compartilhada.

---

## 3. Ferramentas de IA

Utilizei apenas o **Claude (Anthropic), modelo Claude Opus 5.5**, pela interface do claude.ai. Nenhuma outra ferramenta de IA foi usada.

---

## 4. Como a IA participou

A IA funcionou como uma **assistente**, e não como uma desenvolvedora que entrega o projeto pronto. Eu usei o Claude para tirar dúvidas, entender conceitos e receber ajuda na implementação. As decisões, a execução e os testes foram conduzidos por mim, etapa por etapa.

Exemplos de pedidos e de como as respostas foram aproveitadas:

| Pedido | Como usei a resposta |
|---|---|
| Montar um plano de construção para executar em poucos dias | Adotei o plano por blocos, começando pelo backend. |
| Modelar o banco com uma tabela para cada campo do formulário | A IA argumentou contra; revisei a ideia e optei pela tabela única. |
| Como configurar a connection string de um banco que ainda não existe | Entendi que o EF cria o banco e montei a string a partir da minha instância do SQL Server. |
| Usar try/catch sempre que possível | Discutimos e adotei try/catch pontual com um tratador global. |
| Diagnóstico de erros colados do terminal (git, curl, redirecionamento 307) | Identifiquei as causas e apliquei as correções. |
| Revisão do meu wireframe, com cores vivas e de fácil leitura | Aceitei os ajustes de usabilidade e a paleta proposta. |
| Qual a complexidade de extrair área de interesse e resumo do PDF | Comparei as opções e decidi priorizar a entrega completa, deixando isso como melhoria. |
| Geração de código (entidade, DbContext, DTOs, controllers, serviços, testes, telas) | Revisei, adaptei ao meu projeto e compilei cada parte, pedindo a explicação de cada trecho. |

---

## 5. O que precisei corrigir, adaptar ou descartar

**Sugestões da IA que precisei corrigir ou adaptar:**

- As instruções iniciais eram por linha de comando; adaptei para o Visual Studio, que era a ferramenta que eu estava usando.
- O namespace do código sugerido não era o do meu projeto; ajustei para `Cadastro_Curriculos`.
- Um erro do Git ("O pipe foi finalizado") foi diagnosticado inicialmente como falha de conexão com o banco. A causa real estava no Git do Visual Studio, e descartei as sugestões de conexão.
- O conteúdo sugerido para o arquivo `.http` apagava a variável com o endereço da API; corrigi.

**Problemas do ambiente que resolvi:**

- O repositório estava sem `.gitignore`, e as pastas `bin` e `obj` tinham sido commitadas. Criei o `.gitignore` do .NET e removi as pastas com `git rm --cached`.
- O `curl` do PowerShell é um apelido de outro comando; passei a usar `curl.exe`.
- O Bootstrap foi instalado por engano fora da pasta do projeto Angular. Identifiquei pela data dos arquivos e corrigi antes do commit.
- Colei o HTML da tela inicial no arquivo de estilos; os erros do editor mostraram o problema.
- A data de cadastro aparecia 3 horas adiantada, porque o valor UTC chegava ao frontend sem indicação de fuso. Corrigi no backend com `DateTime.SpecifyKind`.
- Um push foi rejeitado porque eu tinha editado um arquivo direto no GitHub. Resolvi com `git pull --rebase`, sem push forçado.

**Descartado:** a tabela por campo, o try/catch em todos os métodos e a extração de área e resumo neste momento.

---

## 6. Como verifiquei a solução

- **Revisão do que foi gerado:** conferi a migration antes de aplicá-la e a estrutura criada no SQL Server Management Studio (tabela, índice único e valor padrão).
- **Testes automatizados (xUnit)**, todos aprovados:
  - `CurriculoExtratorTests`: extração com texto completo, texto vazio, ausência de telefone, título antes do nome, linhas de contato, e-mail em maiúsculas, cinco formatos de telefone e CPF que não pode ser confundido com telefone.
  - `CandidatoRequestValidacaoTests`: campos obrigatórios, tamanho máximo e formatos inválidos de e-mail, conferindo o texto das mensagens.
  - `LeitorPdfTests`: arquivo ausente, vazio, acima de 5 MB, com extensão errada, renomeado para `.pdf`, válido e corrompido.
- **Testes manuais da API** com o arquivo `.http` e o `curl`: cadastro (201), e-mail duplicado (409), dados inválidos (400), detalhes (200), id inexistente (404), banco desligado (503) e uploads com PDF válido, arquivo falso, requisição sem arquivo e PDF escaneado.
- **Testes manuais do frontend**, com backend e frontend rodando juntos:
  - Formulário: salvar vazio, e-mail inválido, nome só com espaços, cadastro válido, e-mail duplicado, importação do currículo fictício, arquivo falso, imagem e API desligada.
  - Lista e detalhes: hora de cadastro correta, navegação para os detalhes, aviso de cadastro salvo, id inexistente, id inválido, API desligada e resumo com várias linhas.

Os testes automatizados ficaram concentrados no backend, onde está a lógica de extração e de validação. O frontend foi verificado manualmente.

---

## 7. Tempo dedicado

Aproximadamente **12 horas**: cerca de **8 horas no backend** e **4 horas no frontend**.

---

## 8. Dificuldades, limitações e melhorias

### Dificuldades

As maiores dificuldades não estiveram nas tomadas de decisão, mas em **executar corretamente** cada decisão tomada. O melhor exemplo é a leitura do PDF para preencher o formulário: apesar de o PdfPig ser uma biblioteca simples, eu nunca tinha feito esse tipo de extração. Precisei entender como o texto sai do PDF, por que as quebras de linha importam para encontrar o nome e como validar o arquivo de forma segura.

### Limitações conhecidas

- O nome é identificado por heurística: se um cargo aparecer na primeira linha do currículo, pode ser confundido com o nome.
- Havendo mais de um e-mail ou telefone, só o primeiro é capturado.
- Telefones fora do padrão brasileiro não são reconhecidos.
- PDFs escaneados (imagem) não são lidos, porque não há OCR.
- Área de interesse e resumo não são preenchidos a partir do PDF.
- Não há testes automatizados no frontend.

Em todos os casos, o formulário permite completar ou corrigir os dados antes de salvar.

### Melhorias que faria com mais tempo

- **Preencher área de interesse e resumo profissional com IA**, enviando o texto do currículo a um modelo de linguagem que devolva os campos estruturados. Seria preciso tratar custo, disponibilidade do serviço e, principalmente, o envio de dados pessoais a terceiros, de acordo com a LGPD.
- **Login de administrador**, com acesso à lista e aos detalhes restrito a ele. O candidato continuaria podendo se cadastrar sem login; fazendo login, poderia editar o próprio cadastro.
- **Exclusão de cadastros** pelo administrador.
- **Impressão do cadastro** a partir da tela de detalhes.
- **Tabelas próprias para telefones e e-mails**, permitindo mais de um de cada por candidato (relação 1:N). O índice único passaria para a tabela de e-mails.
- **OCR** para ler currículos escaneados.
- **Paginação e busca** na listagem.
- **Testes de integração** da API com banco de teste e **testes de componente** no frontend.
