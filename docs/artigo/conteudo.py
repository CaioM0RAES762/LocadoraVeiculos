# -*- coding: utf-8 -*-
"""
Conteúdo único do relatório. `gerar_artigo.py` converte este conteúdo em artigo.tex (padrão SBC) e artigo.docx,
mantendo os dois idênticos. Marcações inline: **negrito**, *itálico*, `código`, {fig:id}, {tab:id}, {cite:chave}.
"""

TITULO = "Locadora de Veículos: integração entre frontend React, API ASP.NET Core e SQL Server"

AUTOR = "[PREENCHER: nome do aluno]"
INSTITUICAO = "[PREENCHER: instituição]"
EMAIL = "[PREENCHER: e-mail do aluno]"
DISCIPLINA = "[PREENCHER: disciplina]"

RESUMO = (
    "Este trabalho descreve a segunda etapa do sistema de uma locadora de veículos: um frontend em React e TypeScript integrado, "
    "por meio de uma API REST em ASP.NET Core, a um banco SQL Server modelado com Entity Framework Core na primeira etapa. "
    "São apresentados o problema, a modelagem com cinco entidades, a arquitetura em camadas, 20 wireframes de alta fidelidade, "
    "as telas de cadastro, edição, exclusão e pesquisa de todas as entidades e as consultas SQL expostas como filtros e visualizações, "
    "com destaque para veículos disponíveis e aluguéis por período. Todas as telas usam a API e o banco reais; mocks existem somente em testes automatizados. "
    "A validação inclui 82 testes de telas e serviços, 8 testes ponta a ponta com o SQL Server e varredura de acessibilidade. "
    "O resultado é um sistema funcional com CRUD completo, filtros em pelo menos dois campos por entidade e tratamento de erros compreensível ao usuário."
)
PALAVRAS_CHAVE = "locadora de veículos; React; ASP.NET Core; SQL Server; API REST; Entity Framework Core"

ABSTRACT = (
    "This paper describes the second stage of a vehicle rental system: a React and TypeScript frontend integrated, through an ASP.NET Core REST API, "
    "with a SQL Server database modeled with Entity Framework Core in the first stage. It presents the problem, the five-entity data model, the layered architecture, "
    "20 high-fidelity wireframes, the create, edit, delete and search screens for every entity, and the SQL queries exposed as filters and views, "
    "especially available vehicles and rentals by period. All screens use the real API and database; mocks exist only in automated tests. "
    "Validation includes 82 screen and service tests, 8 end-to-end tests against SQL Server and an accessibility scan. "
    "The result is a working system with complete CRUD, filters on at least two fields per entity and user-friendly error handling."
)
KEYWORDS = "vehicle rental; React; ASP.NET Core; SQL Server; REST API; Entity Framework Core"

# Cada bloco: (tipo, ...). Tipos: h1, h2, p, ul, ol, fig, tab, code
CORPO = [
    ("h1", "Introdução"),
    ("p", "Locadoras de veículos lidam com informações que mudam o tempo todo: quais carros estão livres, quem está com cada um, quando devem voltar e quanto "
          "deve ser cobrado. Quando esse controle é feito de forma manual, aparecem aluguéis conflitantes, devoluções esquecidas e valores incorretos. "
          "Um sistema com banco de dados e interface web reduz esses erros ao concentrar as regras em um só lugar."),
    ("p", "Este trabalho corresponde à **Etapa 2** de um projeto em duas partes. Na Etapa 1 foram construídos o modelo de dados, as migrations e uma API REST em ASP.NET Core com "
          "Entity Framework Core e SQL Server, documentada e testada pelo Swagger. Na Etapa 2 foi desenvolvido o frontend que consome essa API, com wireframes, telas "
          "de CRUD para todas as entidades, filtros e visualizações baseados nas consultas do banco. O trabalho é individual e o código está versionado em Git "
          "(repositório: [PREENCHER: URL do repositório])."),
    ("p", "O relatório segue o modelo de publicação de artigos da SBC {cite:sbc}. O restante do texto segue a ordem do desenvolvimento: problema e objetivos (Seção 2), modelagem (3), arquitetura e tecnologias (4), wireframes (5), "
          "telas (6), integração com a API (7), CRUD (8), filtros (9), as duas consultas de demonstração (10 e 11), testes (12), dificuldades (13) e conclusão (14)."),

    ("h1", "Descrição do problema e objetivos"),
    ("h2", "Problema"),
    ("p", "A locadora precisa cadastrar fabricantes, categorias, clientes e veículos, registrar aluguéis, acompanhar a situação de cada locação (em andamento, atrasada ou devolvida) "
          "e calcular o valor devido na devolução. Também precisa responder a perguntas do dia a dia: quais veículos estão disponíveis agora, quais aluguéis ocorreram em um período, "
          "qual o histórico de um cliente e quais clientes ainda não alugaram nenhum veículo."),
    ("h2", "Objetivos"),
    ("ul", [
        "Integrar frontend, API, back-end e banco de dados, reaproveitando todos os artefatos da Etapa 1 sem substituir o back-end;",
        "implementar cadastro, edição, exclusão e pesquisa para as cinco entidades, com filtros personalizados em pelo menos dois campos por entidade;",
        "expor no frontend as consultas SQL da Etapa 1 (JOINs) por meio das rotas já existentes;",
        "produzir wireframes de média/alta fidelidade e implementar as telas previstas;",
        "garantir qualidade com testes automatizados, inclusive contra o banco real, e com atenção à acessibilidade.",
    ]),

    ("h1", "Modelagem do banco de dados"),
    ("h2", "Entidades e relacionamentos"),
    ("p", "O modelo conceitual ({fig:modelo}) foi definido na Etapa 1 e permanece inalterado na Etapa 2: a evolução do esquema não foi necessária, pois a disponibilidade de um veículo "
          "e a situação de um aluguel são derivadas das datas e calculadas nas consultas, em vez de armazenadas."),
    ("fig", "modelo", "modelo-conceitual.png", "Modelo conceitual do banco de dados (Etapa 1): cinco entidades e quatro relacionamentos 1:N.", 11.0),
    ("tab", "entidades", "Entidades e principais atributos.", ["Entidade", "Atributos", "Relacionamentos"], [
        ["Fabricante", "Id, Nome (único, até 100)", "1:N com Veículo"],
        ["Categoria", "Id, Nome (único, até 80)", "1:N com Veículo"],
        ["Cliente", "Id, Nome, CPF (11 dígitos, único), E-mail (único)", "1:N com Aluguel"],
        ["Veículo", "Id, Placa (única), Modelo, AnoFabricacao, Quilometragem, FabricanteId, CategoriaId", "N:1 com Fabricante e Categoria; 1:N com Aluguel"],
        ["Aluguel", "Id, ClienteId, VeiculoId, DataInicio, DataFimPrevista, DataDevolucao, QuilometragemInicial, QuilometragemFinal, ValorDiaria, ValorTotal", "N:1 com Cliente e Veículo"],
    ], [2.6, 8.4, 4.4]),
    ("h2", "Regras de integridade"),
    ("p", "O banco protege os dados com chaves estrangeiras `ON DELETE RESTRICT`, índices únicos (nome do fabricante e da categoria, CPF, e-mail e placa) e restrições `CHECK`: "
          "ano de fabricação maior ou igual a 1900, quilometragens não negativas, fim previsto posterior ao início, quilometragem final maior ou igual à inicial, diária positiva e total não negativo. "
          "A API repete essas validações e devolve mensagens claras: erros de formato retornam `400`, registros inexistentes `404` e violações de unicidade ou vínculo `409`. "
          "Um aluguel em aberto (sem data de devolução) impede um segundo aluguel em aberto do mesmo veículo."),

    ("h1", "Arquitetura e tecnologias"),
    ("p", "A aplicação segue uma arquitetura em quatro blocos ({fig:arquitetura}). O navegador executa uma aplicação de página única (SPA) em React; em desenvolvimento, o servidor do Vite "
          "encaminha as chamadas a `/api` para a API, o que elimina a necessidade de CORS; a API ASP.NET Core aplica validações e regras de negócio e acessa o SQL Server pelo Entity Framework Core "
          "{cite:efcore,aspnet}. O estilo de comunicação é REST com JSON {cite:fielding}."),
    ("fig", "arquitetura", "arquitetura.png", "Arquitetura da solução: frontend, proxy de desenvolvimento, API e banco de dados.", 15.0),
    ("tab", "tecnologias", "Tecnologias utilizadas.", ["Camada", "Tecnologias e finalidade"], [
        ["Banco", "SQL Server; migrations do EF Core; índices únicos e restrições CHECK"],
        ["Backend", ".NET 9, ASP.NET Core, EF Core 9, controllers REST, Swagger (Swashbuckle)"],
        ["Frontend", "React 19 {cite:react}, TypeScript 6, Vite 8 {cite:vite}, React Router 7 {cite:router}, `fetch` e CSS próprio"],
        ["Testes", "Vitest 5 {cite:vitest} e Testing Library {cite:rtl} (telas e serviços); Playwright {cite:playwright} e axe-core {cite:axe} (ponta a ponta e acessibilidade)"],
        ["Qualidade", "ESLint (com regras de hooks do React) e verificador de tipos do TypeScript em modo estrito"],
    ], [2.6, 12.8]),
    ("p", "Foram evitadas bibliotecas desnecessárias: não há biblioteca de componentes visuais, de gerenciamento de estado ou de requisições. A identidade visual (azul-petróleo com destaque laranja, "
          "logotipo e ícones de traço) foi criada para este projeto, sem imagens ou textos de terceiros."),

    ("h1", "Wireframes"),
    ("p", "Antes de programar, foram desenhados 20 wireframes de alta fidelidade em formato desktop (1440 px), que cobrem: layout e navegação; painel inicial; lista e formulário de cada entidade; "
          "as consultas de clientes sem aluguéis, veículos disponíveis, veículos por fabricante, aluguéis por período e histórico por cliente; a janela de devolução; a confirmação de exclusão; "
          "e os estados de carregamento, lista vazia, erro e avisos. Cada quadro traz anotações numeradas e uma faixa de notas que relaciona a tela às rotas da API."),
    ("p", "Os quadros são gerados por um script (`npm run wireframes`) a partir de descrições de layout e exportados em SVG editável e PNG, o que permite recriá-los de forma consistente "
          "sempre que uma tela mudar. As imagens estão em `docs/wireframes/` e os SVGs, preparados para importação no Figma, em `docs/wireframes/svg/`."),
    ("p", "**Link do Figma: [PREENCHER: link compartilhável do arquivo no Figma].** O link não consta nesta versão porque a integração com o Figma recusou a conexão por falta de autenticação "
          "e nenhum arquivo foi criado nessa ferramenta. Para publicar, basta arrastar os SVGs para um arquivo de design do Figma e compartilhar o link."),
    ("fig", "wflayout", "wf-layout.png", "Wireframe do layout geral e da navegação (menu, trilha, abas, filtros e resultados), com esboço da versão móvel.", 12.5),
    ("fig", "wfalugueis", "wf-alugueis-lista.png", "Wireframe da listagem de aluguéis, que foi seguido na tela implementada ({fig:telaalugueis}).", 12.5),
    ("tab", "wftelas", "Correspondência entre wireframes e telas implementadas.", ["Wireframe", "Tela / rota", "Captura"], [
        ["01 Painel", "`/`", "{fig:telapainel}"],
        ["02–05 Fabricantes e categorias", "`/fabricantes`, `/categorias` (lista, novo, editar)", "{fig:telavalidacao}, {fig:telaconfirmar}"],
        ["06–08 Clientes", "`/clientes` (aba Sem aluguéis), `/clientes/novo`", "{fig:telaclientes}, {fig:telaclienteform}"],
        ["09–11 e 18 Veículos", "`/veiculos` (abas Disponíveis e Por fabricante)", "{fig:telaveiculosfiltros}, {fig:telaveiculos}"],
        ["12–14, 19 Aluguéis", "`/alugueis` (abas Por período e Histórico por cliente)", "{fig:telaalugueis}, {fig:telaperiodo}"],
        ["15 Devolução; 16 Exclusão; 17 Estados", "Janelas e avisos compartilhados", "{fig:teladevolucao}, {fig:telaapi}"],
    ], [4.8, 6.4, 4.2]),

    ("h1", "Implementação das telas"),
    ("h2", "Layout, navegação e painel"),
    ("p", "Todas as telas usam o mesmo layout: menu lateral com as cinco entidades e o painel, cabeçalho com trilha de navegação e título, ação principal à direita e área de conteúdo. "
          "Em telas estreitas o menu vira um painel recolhível acionado por botão e as tabelas se transformam em cartões. O painel inicial ({fig:telapainel}) exibe indicadores calculados "
          "com listas reais da API (fabricantes, categorias, clientes, veículos, veículos disponíveis, aluguéis em andamento e atrasados), atalhos de cadastro, os aluguéis em aberto "
          "e atalhos para as consultas."),
    ("fig", "telapainel", "tela-painel.png", "Painel inicial com indicadores lidos da API e do SQL Server.", 12.5),
    ("h2", "Componentes e padrões"),
    ("p", "A interface é composta por componentes reutilizáveis: botões, campos com rótulo e mensagem de erro associados, tabela responsiva, selos de situação, abas de consulta, "
          "barra de filtros, diálogos modais (elemento nativo `<dialog>` {cite:mdndialog}), avisos de sucesso e erro e estados de carregamento, vazio e erro. "
          "As cinco entidades seguem o mesmo padrão; fabricantes e categorias, por terem apenas o campo nome, compartilham os mesmos componentes de lista e formulário."),
    ("h2", "Acessibilidade e responsividade"),
    ("p", "Foram adotadas práticas das diretrizes WCAG 2.2 {cite:wcag}: rótulos associados a cada campo, resumo de erros com `role=\"alert\"` e foco movido para ele, "
          "foco visível, navegação por teclado, link para pular ao conteúdo, foco devolvido à área principal a cada troca de tela, contraste adequado e respeito à preferência por menos movimento. "
          "Uma varredura automática com axe-core nas sete telas principais não encontrou violações graves ou críticas dos níveis A e AA (Seção 12). "
          "A responsividade foi verificada em largura de celular ({fig:telamobile})."),
    ("fig", "telamobile", "tela-mobile.png", "Tela de veículos em largura de celular: menu recolhível e filtros empilhados.", 5.2),

    ("h1", "Integração com a API"),
    ("h2", "Camada de serviços"),
    ("p", "Todo o acesso à API fica em `frontend/src/services`. Um cliente HTTP único (`http.ts`) monta a URL com base em `VITE_API_URL` (vazia por padrão, para usar o proxy do Vite), "
          "serializa o JSON e converte as respostas em dados ou em um erro tipado (`ApiError`). Cada entidade tem um módulo com as operações REST e com as rotas especiais, "
          "e uma função gera a lista de operações padrão (obter, criar, atualizar, excluir), evitando repetição."),
    ("h2", "Tratamento de respostas e erros"),
    ("p", "O cliente trata `200`, `201`, `204`, `400`, `404`, `409` e `500`, além de falha de rede, API indisponível e JSON inválido. Respostas `400` no formato `ValidationProblemDetails` são convertidas "
          "em mensagens por campo (as chaves vêm em PascalCase no corpo e em camelCase na query string, e são normalizadas); mensagens `{ \"mensagem\": ... }` são exibidas como estão. "
          "Um erro `5xx` sem corpo JSON, típico do proxy sem API, vira \"Não foi possível conectar à API\" ({fig:telaapi}). Os componentes oferecem a ação \"Tentar novamente\"."),
    ("fig", "telaapi", "tela-api-indisponivel.png", "Mensagem exibida quando a API está indisponível, com opção de tentar novamente.", 12.0),
    ("h2", "Alterações mínimas no backend"),
    ("p", "Para a integração foram feitas somente alterações aditivas, sem quebrar o contrato da Etapa 1 e sem alterar o esquema do banco:"),
    ("ol", [
        "**CORS restrito** às origens configuradas em `Cors:AllowedOrigins` (por padrão `localhost` e `127.0.0.1` nas portas 5173 e 4173), com os métodos GET, POST, PUT e DELETE e o cabeçalho `Content-Type` {cite:cors}. "
        "Como o tratador global de exceções limpa os cabeçalhos da resposta, a política é reaplicada nele para que o navegador consiga ler as mensagens `409` e `500`;",
        "**filtros opcionais por query string** nos `GET` de listagem (por exemplo `GET /api/Veiculos?placa=abc&disponivel=true`), de modo que o filtro seja executado no banco e não no navegador;",
        "**campos derivados**: `disponivel` nas respostas de veículo e `situacao` (`EmAndamento`, `Atrasado` ou `Devolvido`) nas de aluguel, calculados na consulta;",
        "o `.csproj` passou a ignorar a pasta `frontend/` na compilação e o `dotnet-ef` foi registrado como ferramenta local do projeto.",
    ]),

    ("h1", "Operações CRUD"),
    ("p", "As cinco entidades possuem listagem, cadastro, edição e exclusão, com carregamento, estado vazio, validação de formulário, mensagem de sucesso ou erro e atualização da lista após cada alteração. "
          "A validação no navegador espelha as regras da API apenas para dar retorno imediato; as mensagens da API continuam sendo exibidas no formulário quando ocorrem."),
    ("fig", "telavalidacao", "tela-validacao.png", "Validação de formulário: o resumo de erros recebe o foco e o campo é marcado como inválido.", 12.0),
    ("ul", [
        "**Fabricantes e categorias:** formulário com o campo nome; exclusão recusada com `409` quando há veículos vinculados.",
        "**Clientes:** nome, CPF com máscara (000.000.000-00; a API recebe apenas os 11 dígitos) e e-mail; CPF ou e-mail duplicados retornam `409` ({fig:telaclienteform}).",
        "**Veículos:** placa (ABC1234, ABC-1234 ou ABC1D23), modelo, ano, quilometragem e seleção de fabricante e categoria carregados da API.",
        "**Aluguéis:** cliente e veículo carregados da API (em um novo aluguel, apenas veículos disponíveis pela rota `/filtro/disponiveis`), datas, quilometragens e diária; o valor total é sempre o retornado pela API.",
    ]),
    ("fig", "telaclienteform", "tela-clientes-form.png", "Formulário de cliente com CPF formatado automaticamente.", 12.0),
    ("p", "Toda exclusão pede confirmação em um diálogo modal ({fig:telaconfirmar}). Se a API recusar por vínculos, a mensagem de conflito aparece em um aviso e nada é alterado ({fig:tela409}). "
          "A ordem de exclusão respeita as chaves estrangeiras: aluguéis, veículos, clientes e, por fim, categorias e fabricantes."),
    ("fig", "telaconfirmar", "tela-confirmar-exclusao.png", "Confirmação antes de excluir um registro.", 12.0),
    ("fig", "tela409", "tela-conflito-409.png", "Conflito 409: o fabricante possui veículos vinculados e não pode ser excluído.", 12.0),
    ("h2", "Registro de devolução"),
    ("p", "A API só oferece `PUT` completo para alterar um aluguel. A janela de devolução ({fig:teladevolucao}) carrega o aluguel, pede data e hora e quilometragem final e envia o `PUT` com os dados "
          "atuais e a devolução preenchida. Em seguida lê novamente o aluguel e informa o valor total calculado pela API ({fig:teladevolucaores}). A regra de cobrança fica no backend: cada dia iniciado conta como "
          "uma diária, com no mínimo uma. O frontend mostra apenas uma **estimativa**, identificada como tal, para orientar o usuário antes de confirmar."),
    ("fig", "teladevolucao", "tela-devolucao-janela.png", "Janela de devolução com estimativa visual identificada como tal.", 12.0),
    ("fig", "teladevolucaores", "tela-devolucao-resultado.png", "Resultado da devolução: situação \"Devolvido\" e valor total calculado pela API (4 diárias de R$ 150,00).", 12.0),

    ("h1", "Filtros"),
    ("p", "Cada entidade oferece filtros em pelo menos dois campos ({tab:filtros}). O estado dos filtros e o tipo de consulta ficam na URL, o que preserva a consulta ao recarregar a página, "
          "ao voltar no histórico e ao compartilhar o link. As consultas com rota própria da Etapa 1 aparecem como abas, que exibem a rota chamada e o total de resultados."),
    ("tab", "filtros", "Filtros e consultas por entidade.", ["Entidade", "Filtros combinados (GET de listagem)", "Consultas com rota própria"], [
        ["Fabricante", "código, nome", "—"],
        ["Categoria", "código, nome", "—"],
        ["Cliente", "nome, CPF, e-mail", "`/api/Clientes/filtro/sem-alugueis`"],
        ["Veículo", "placa, modelo, fabricante, categoria, disponibilidade", "`/api/Veiculos/filtro/disponiveis`; `/api/Veiculos/filtro/fabricante?nome=`"],
        ["Aluguel", "cliente, veículo, situação, data inicial e final", "`/api/Alugueis/filtro/periodo?inicio=&fim=`; `/api/Alugueis/filtro/cliente/{id}`"],
    ], [2.2, 6.0, 7.2]),
    ("fig", "telaveiculosfiltros", "tela-veiculos-filtros.png", "Filtros combinados em veículos: fabricante e disponibilidade, enviados à API como parâmetros.", 12.0),
    ("fig", "telaclientes", "tela-clientes-sem-alugueis.png", "Clientes sem aluguéis (consulta LEFT JOIN) com a rota exibida.", 12.0),
    ("fig", "telaveiculos", "tela-veiculos-fabricante.png", "Veículos por fabricante (INNER JOIN): rota com o nome informado e resultados.", 12.0),
    ("fig", "telahistorico", "tela-alugueis-historico.png", "Histórico de aluguéis de um cliente, acessado pelo botão Histórico na lista de clientes.", 12.0),

    ("h1", "Consulta 1: veículos disponíveis"),
    ("p", "**Banco.** Um veículo está disponível quando não existe aluguel em aberto para ele. A consulta faz um `LEFT JOIN` entre Veículos e os aluguéis sem devolução e mantém as linhas sem correspondência; "
          "os `INNER JOIN` com Fabricantes e Categorias trazem os nomes. Esse é o SQL equivalente ao gerado pelo Entity Framework Core a partir do LINQ do `VeiculosController`:"),
    ("code", "SELECT v.Id, v.Placa, v.Modelo, v.AnoFabricacao, v.Quilometragem,\n"
             "       f.Nome AS Fabricante, c.Nome AS Categoria\n"
             "FROM Veiculos v\n"
             "LEFT JOIN Alugueis a ON a.VeiculoId = v.Id AND a.DataDevolucao IS NULL\n"
             "INNER JOIN Fabricantes f ON f.Id = v.FabricanteId\n"
             "INNER JOIN Categorias c ON c.Id = v.CategoriaId\n"
             "WHERE a.Id IS NULL\n"
             "ORDER BY v.Modelo;"),
    ("p", "**Rota.** `GET /api/Veiculos/filtro/disponiveis`, que devolve a lista de veículos com o campo `disponivel` igual a `true`. "
          "**Chamada do frontend.** A aba Disponíveis da tela de veículos chama `veiculosApi.listarDisponiveis()`, que usa o cliente HTTP central. "
          "**Resultado.** Com os dados de demonstração a consulta retornou 10 veículos, número idêntico ao obtido executando o SQL acima diretamente no SQL Server ({fig:teladisponiveis}). "
          "Após registrar um aluguel para um desses veículos, ele deixa de aparecer na aba, e volta a aparecer após a devolução; esse comportamento é verificado nos testes ponta a ponta."),
    ("fig", "teladisponiveis", "tela-veiculos-disponiveis.png", "Consulta 1 no frontend: aba Disponíveis, rota chamada e 10 resultados.", 12.5),

    ("h1", "Consulta 2: aluguéis por período"),
    ("p", "**Banco.** A consulta lista os aluguéis iniciados dentro de um intervalo, com cliente e veículo, por meio de dois `INNER JOIN`. A data final é inclusiva; por isso o limite superior "
          "da condição é o início do dia seguinte:"),
    ("code", "SELECT a.Id, c.Nome AS Cliente, v.Placa, v.Modelo, a.DataInicio, a.DataFimPrevista,\n"
             "       a.DataDevolucao, a.ValorDiaria, a.ValorTotal\n"
             "FROM Alugueis a\n"
             "INNER JOIN Clientes c ON c.Id = a.ClienteId\n"
             "INNER JOIN Veiculos v ON v.Id = a.VeiculoId\n"
             "WHERE a.DataInicio >= '2026-09-25' AND a.DataInicio < '2026-11-25'\n"
             "ORDER BY a.DataInicio;"),
    ("p", "**Rota.** `GET /api/Alugueis/filtro/periodo?inicio=2026-09-25&fim=2026-11-24`; se a data final for anterior à inicial, a API responde `400` com uma mensagem, exibida na tela. "
          "**Chamada do frontend.** A aba Por período exige as duas datas e chama `alugueisApi.listarPorPeriodo(inicio, fim)`. **Resultado.** Para o período de 25/09/2026 a 24/11/2026 a rota retornou 13 aluguéis, "
          "o mesmo total do SQL executado no banco ({fig:telaperiodo}). Cada linha mostra cliente, veículo, datas, situação e o valor total calculado pela API, e permite editar, excluir "
          "ou, se estiver em aberto, registrar a devolução."),
    ("fig", "telaperiodo", "tela-alugueis-periodo.png", "Consulta 2 no frontend: aluguéis por período, com a rota, o intervalo e 13 resultados.", 12.5),
    ("fig", "telaalugueis", "tela-alugueis-lista.png", "Tela de aluguéis implementada a partir do wireframe da {fig:wfalugueis}: filtros combinados, situação e ações por linha.", 12.5),

    ("h1", "Testes e resultados"),
    ("p", "Os testes cobrem três níveis. **Telas e serviços** (Vitest e Testing Library): renderizam a aplicação real com uma API falsa, apenas nos testes, para verificar listagens, filtros, formulários, "
          "validações, exclusão com confirmação, conflitos, erros de rede e as consultas especiais (82 testes). **Ponta a ponta** (Playwright, navegador real, API e SQL Server reais): cadastram, editam, "
          "filtram, alugam, devolvem e excluem registros, verificam conflitos `409`, recarregamento em rotas internas, API indisponível e acessibilidade com axe-core. Os registros criados têm o prefixo "
          "\"TESTE E2E\" e são removidos ao final, o que foi conferido no banco. **Backend**: compilação sem avisos e conferência manual das rotas contra o banco real, além dos 36 testes pelo Swagger da Etapa 1."),
    ("tab", "testes", "Verificações executadas e resultados.", ["Verificação", "Comando", "Resultado"], [
        ["Compilação do backend", "`dotnet build`", "0 avisos, 0 erros"],
        ["Verificação de tipos", "`npm run typecheck`", "sem erros"],
        ["Análise estática", "`npm run lint`", "sem erros"],
        ["Testes de telas e serviços", "`npm test`", "82 aprovados em 7 arquivos"],
        ["Build de produção", "`npm run build`", "concluído (JS 319,5 kB; 98,0 kB comprimido)"],
        ["Ponta a ponta com SQL Server", "`npm run test:e2e`", "8 aprovados (cerca de 45 s)"],
        ["Acessibilidade (axe-core, A e AA)", "dentro do ponta a ponta", "0 violações graves/críticas em 7 telas"],
        ["SQL x API", "`sqlcmd` x `curl`", "10, 13 e 2 linhas, idênticas nas três consultas"],
        ["API da Etapa 1 (Swagger)", "`docs/relatorio-testes.md`", "36 testes aprovados (04/10/2026)"],
    ], [5.2, 4.6, 5.6]),
    ("p", "Ambiente: Windows 11, SQL Server 2025 (instância padrão), SDK .NET 10 executando o projeto `net9.0` com `DOTNET_ROLL_FORWARD`, Node.js 24 e Microsoft Edge para os testes de navegador. "
          "Limitações: o backend não tem suíte automatizada própria (foi verificado manualmente e indiretamente pelos testes ponta a ponta) o `artigo.tex` não pôde ser compilado e o `artigo.docx` não pôde ser conferido no Word neste ambiente (Seção 13)."),

    ("h1", "Dificuldades encontradas"),
    ("ul", [
        "**Ambiente do banco e do .NET.** A instância `SQLEXPRESS` configurada na Etapa 1 não existia na máquina de desenvolvimento e só havia os runtimes .NET 8 e 10. A solução foi apontar a "
        "cadeia de conexão por variável de ambiente (sem alterar o `appsettings.json`) e usar `DOTNET_ROLL_FORWARD`.",
        "**CORS em respostas de erro.** O tratador global de exceções limpava os cabeçalhos, então erros `409` e `500` apareceriam ao navegador como falha de rede. A política CORS é reaplicada no tratador.",
        "**Pasta do frontend no projeto .NET.** Os arquivos de `node_modules` foram incluídos pelo SDK na compilação; a pasta passou a ser excluída no `.csproj`.",
        "**Formato dos erros de validação.** As chaves chegam em PascalCase no corpo e em camelCase na query; foi preciso normalizá-las para associar a mensagem ao campo.",
        "**Devolução com `PUT` completo.** Como não há endpoint específico, a tela reenvia todos os dados do aluguel com a devolução e depois relê o valor total.",
        "**Tabelas largas.** A tabela de aluguéis tinha colunas demais para 1366 px; as datas foram agrupadas em uma coluna \"Período\" e, em telas estreitas, as linhas viram cartões.",
        "**Regras de pureza do React.** O lint dos hooks proíbe alterar estado de forma síncrona em efeitos; o carregamento foi derivado de uma chave de consulta, sem efeitos adicionais.",
        "**Ferramentas indisponíveis.** O Figma recusou a conexão por falta de login e não há LaTeX instalado. Os wireframes foram gerados em SVG/PNG (prontos para o Figma). O relatório nasce de um único "
        "conteúdo (`conteudo.py`) que gera o `artigo.tex` (escrito para `pdflatex` e `bibtex`, mas **não compilado** aqui), o `artigo.docx` e uma versão HTML, impressa em PDF pelo navegador. "
        "O PDF entregue foi conferido visualmente página a página; o `.docx` foi gerado por script e não pôde ser aberto no Word para conferência.",
    ]),

    ("h1", "Conclusão"),
    ("p", "O trabalho entregou um frontend completo, integrado à API e ao SQL Server reais, com CRUD das cinco entidades, filtros em todas as telas, as consultas SQL da Etapa 1 visíveis na interface, "
          "wireframes de alta fidelidade, testes automatizados em três níveis e tratamento de erros compreensível. As alterações no backend foram mínimas e compatíveis com a Etapa 1, e o esquema do banco não mudou."),
    ("p", "Como próximos passos, destacam-se a publicação dos wireframes no Figma, a gravação do vídeo de apresentação, uma suíte automatizada para o backend, paginação das listagens e, fora do escopo atual, "
          "autenticação e controle de acesso. Os artefatos, o roteiro do vídeo e o checklist de entrega estão no repositório."),
]

# Referências: chave -> (rótulo no texto, entrada completa em texto simples, campos BibTeX)
REFERENCIAS = {
    "efcore": ("Microsoft, s.d.", "Microsoft. Entity Framework Core documentation. Disponível em: https://learn.microsoft.com/ef/core/. Acesso em: nov. 2026.",
               {"author": "{Microsoft}", "title": "Entity Framework Core documentation", "howpublished": "\\url{https://learn.microsoft.com/ef/core/}", "note": "Acesso em: nov. 2026"}),
    "aspnet": ("Microsoft, s.d.", "Microsoft. ASP.NET Core documentation. Disponível em: https://learn.microsoft.com/aspnet/core/. Acesso em: nov. 2026.",
               {"author": "{Microsoft}", "title": "ASP.NET Core documentation", "howpublished": "\\url{https://learn.microsoft.com/aspnet/core/}", "note": "Acesso em: nov. 2026"}),
    "cors": ("Microsoft, s.d.", "Microsoft. Enable Cross-Origin Requests (CORS) in ASP.NET Core. Disponível em: https://learn.microsoft.com/aspnet/core/security/cors. Acesso em: nov. 2026.",
             {"author": "{Microsoft}", "title": "Enable Cross-Origin Requests (CORS) in ASP.NET Core", "howpublished": "\\url{https://learn.microsoft.com/aspnet/core/security/cors}", "note": "Acesso em: nov. 2026"}),
    "fielding": ("Fielding, 2000", "Fielding, R. T. Architectural Styles and the Design of Network-based Software Architectures. Tese (Doutorado em Informação e Ciência da Computação) — University of California, Irvine, 2000.",
                 {"author": "Fielding, Roy Thomas", "title": "Architectural Styles and the Design of Network-based Software Architectures", "year": "2000", "howpublished": "Tese (Doutorado), University of California, Irvine"}),
    "react": ("React, s.d.", "React. React documentation. Disponível em: https://react.dev/. Acesso em: nov. 2026.",
              {"author": "{React}", "title": "React documentation", "howpublished": "\\url{https://react.dev/}", "note": "Acesso em: nov. 2026"}),
    "vite": ("Vite, s.d.", "Vite. Vite: next generation frontend tooling. Disponível em: https://vite.dev/. Acesso em: nov. 2026.",
             {"author": "{Vite}", "title": "Vite: next generation frontend tooling", "howpublished": "\\url{https://vite.dev/}", "note": "Acesso em: nov. 2026"}),
    "router": ("React Router, s.d.", "React Router. React Router documentation. Disponível em: https://reactrouter.com/. Acesso em: nov. 2026.",
               {"author": "{React Router}", "title": "React Router documentation", "howpublished": "\\url{https://reactrouter.com/}", "note": "Acesso em: nov. 2026"}),
    "vitest": ("Vitest, s.d.", "Vitest. Vitest: next generation testing framework. Disponível em: https://vitest.dev/. Acesso em: nov. 2026.",
               {"author": "{Vitest}", "title": "Vitest: next generation testing framework", "howpublished": "\\url{https://vitest.dev/}", "note": "Acesso em: nov. 2026"}),
    "rtl": ("Testing Library, s.d.", "Testing Library. React Testing Library. Disponível em: https://testing-library.com/docs/react-testing-library/intro/. Acesso em: nov. 2026.",
            {"author": "{Testing Library}", "title": "React Testing Library", "howpublished": "\\url{https://testing-library.com/docs/react-testing-library/intro/}", "note": "Acesso em: nov. 2026"}),
    "playwright": ("Microsoft, s.d.", "Microsoft. Playwright: fast and reliable end-to-end testing. Disponível em: https://playwright.dev/. Acesso em: nov. 2026.",
                   {"author": "{Microsoft}", "title": "Playwright: fast and reliable end-to-end testing", "howpublished": "\\url{https://playwright.dev/}", "note": "Acesso em: nov. 2026"}),
    "axe": ("Deque Systems, s.d.", "Deque Systems. axe-core: accessibility engine for automated web UI testing. Disponível em: https://github.com/dequelabs/axe-core. Acesso em: nov. 2026.",
            {"author": "{Deque Systems}", "title": "axe-core: accessibility engine for automated web UI testing", "howpublished": "\\url{https://github.com/dequelabs/axe-core}", "note": "Acesso em: nov. 2026"}),
    "wcag": ("W3C, 2023", "W3C. Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation, 2023. Disponível em: https://www.w3.org/TR/WCAG22/. Acesso em: nov. 2026.",
             {"author": "{W3C}", "title": "Web Content Accessibility Guidelines (WCAG) 2.2", "year": "2023", "howpublished": "\\url{https://www.w3.org/TR/WCAG22/}", "note": "W3C Recommendation. Acesso em: nov. 2026"}),
    "mdndialog": ("MDN, s.d.", "MDN Web Docs. The Dialog element. Disponível em: https://developer.mozilla.org/docs/Web/HTML/Element/dialog. Acesso em: nov. 2026.",
                  {"author": "{MDN Web Docs}", "title": "The Dialog element", "howpublished": "\\url{https://developer.mozilla.org/docs/Web/HTML/Element/dialog}", "note": "Acesso em: nov. 2026"}),
    "sbc": ("SBC, s.d.", "Sociedade Brasileira de Computação. Modelo para publicação de artigos da SBC. Disponível em: https://www.sbc.org.br/. Acesso em: nov. 2026.",
            {"author": "{Sociedade Brasileira de Computação}", "title": "Modelo para publicação de artigos da SBC", "howpublished": "\\url{https://www.sbc.org.br/}", "note": "Acesso em: nov. 2026"}),
}
