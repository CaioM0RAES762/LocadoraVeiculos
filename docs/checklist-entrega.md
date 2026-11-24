# Checklist de entrega — Trabalho Prático 2 (Front-end integrado)

**Autor:** Caio Moraes da Silva · PUC Minas, Unidade Betim · Disciplina: Tecnologias para Análise e Desenvolvimento de Sistemas

Legenda: ✅ verificado · ⏳ pendente (depende do aluno)

## Pendência única

- ⏳ **Gravação e envio do vídeo de apresentação, com duração entre 3 e 5 minutos.** O roteiro está pronto em [roteiro-video.md](roteiro-video.md).

## Requisitos do enunciado

| Item | Situação | Onde está / como foi verificado |
| --- | --- | --- |
| Usa todos os artefatos do Trabalho Prático 1 (API, banco, migrations, documentação) | ✅ | Backend preservado; só houve mudanças aditivas, descritas em `docs/documentacao-apis.md`. `dotnet build`: 0 avisos, 0 erros |
| Wireframes de média/alta fidelidade com link compartilhável | ✅ | 20 quadros no Figma (link abaixo), em PNG (`docs/wireframes/`) e em SVG editável (`docs/wireframes/svg/`) |
| Cadastro, edição, exclusão e pesquisa para **as cinco entidades** | ✅ | Fabricantes, categorias, clientes, veículos e aluguéis; testes ponta a ponta com a API e o SQL Server reais (8 aprovados) |
| Filtros personalizados em **pelo menos dois campos por entidade** | ✅ | Fabricante/categoria: código e nome · Cliente: nome, CPF, e-mail · Veículo: placa, modelo, fabricante, categoria, disponibilidade · Aluguel: cliente, veículo, situação, período |
| Funcionalidades que usam as consultas do banco | ✅ | Veículos disponíveis, veículos por fabricante, clientes sem aluguéis, aluguéis por período e histórico por cliente; as contagens do SQL executado no banco e da API coincidem (10, 13 e 2 linhas) |
| Utiliza as rotas criadas no Trabalho Prático 1 | ✅ | Todas as rotas `/filtro/...` são chamadas pelo frontend (ver README) |
| Telas previstas nos wireframes | ✅ | Telas implementadas em `frontend/src/pages`; correspondência na Tabela 3 do relatório |
| Front-end em HTML/CSS/JavaScript (frameworks permitidos) | ✅ | React + TypeScript + Vite, CSS próprio |
| Pasta específica do front-end na estrutura do TP1 | ✅ | `frontend/` na raiz do repositório |
| Sem dados estáticos ou mocados na aplicação | ✅ | Toda a aplicação usa a API real; mocks existem apenas nos testes do Vitest |
| Relatório no modelo da SBC | ✅ | `docs/artigo/artigo.pdf` (19 páginas), compilado de `artigo.tex` com o modelo SBC (`sbc-template.sty` e `sbc.bst` em `docs/artigo/`); `pdflatex` + `bibtex` + `pdflatex` ×2, sem referências indefinidas nem conteúdo fora das margens; todas as páginas conferidas visualmente |
| Versão `.docx` do relatório | ✅ | `docs/artigo/artigo.docx`, gerada do mesmo conteúdo e conferida (exportada para PDF pelo Word: 20 páginas) |
| Repositório no GitHub com commits constantes | ✅ | https://github.com/CaioM0RAES762/LocadoraVeiculos.git — branch `main` enviada (sem `push --force`); confirmado com `git ls-remote` |
| Arquivos para entrega | ✅ | Fora do repositório, em `Desktop\Tbl2`: `LocadoraVeiculos-entrega.zip`, `LocadoraVeiculos-repositorio-com-historico.zip` e `LocadoraVeiculos-historico.bundle` |

## Links

- Figma: https://www.figma.com/design/h5DPiA2ZDKuXXmZ4pPTxMg/Untitled?node-id=1-3&t=qwLSrYq5Za5AQfFy-1
  - ✅ Consultado sem sessão autenticada: o serviço de incorporação (oEmbed) do Figma respondeu `200` com o arquivo (um identificador inexistente responde `404`), o que indica que o link é público.
  - ℹ️ Não é possível comprovar por fora a permissão exata nem o conteúdo. Confirme no Figma, em **Share**, que está como **Anyone with the link → Can view** e que os 20 quadros estão visíveis.
- GitHub: https://github.com/CaioM0RAES762/LocadoraVeiculos.git

## Verificações executadas

| Verificação | Comando | Resultado |
| --- | --- | --- |
| Backend | `dotnet restore` e `dotnet build` | sem avisos e sem erros |
| Tipos | `npm run typecheck` | sem erros |
| Lint | `npm run lint` | sem erros |
| Testes de telas e serviços | `npm test` | 82 aprovados (7 arquivos) |
| Build de produção | `npm run build` | concluído |
| Ponta a ponta (API + SQL Server reais) | `npm run test:e2e` | 8 aprovados, incluindo acessibilidade (axe-core) |
| Relatório | `pdflatex`, `bibtex`, `pdflatex`, `pdflatex` | 19 páginas, sem referências quebradas |

## Segurança e privacidade

- ✅ Nenhuma senha, token ou segredo no repositório; o `appsettings.json` usa autenticação integrada do Windows (sem usuário/senha).
- ✅ Dados de demonstração **fictícios** (nomes inventados, e-mails `@exemplo.test`, CPFs gerados apenas com dígitos verificadores válidos, placas inventadas); dados de teste "TESTE E2E" removidos do banco ao final dos testes.
- ✅ Os arquivos de entrega não incluem `node_modules`, `bin`, `obj`, `dist`, logs, caches, `.env` nem bancos locais; o ZIP de entrega também não inclui `.git`.
- ✅ Nenhuma imagem, ícone ou texto de terceiros: logotipo, ícones e wireframes foram desenhados para este projeto.
