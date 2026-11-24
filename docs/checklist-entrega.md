# Checklist de entrega — Trabalho Prático 2 (Front-end integrado)

Legenda: ✅ pronto e verificado · ⏳ depende de você (aluno) · ⚠️ atenção

## Requisitos do enunciado

| Item | Situação | Onde está / evidência |
| --- | --- | --- |
| Usa todos os artefatos do Trabalho Prático 1 (API, banco, migrations, documentação) | ✅ | Backend preservado; a única mudança de contrato foi aditiva (ver `docs/documentacao-apis.md`) |
| Wireframes de média/alta fidelidade | ✅ | 20 quadros em `docs/wireframes/` (PNG) e `docs/wireframes/svg/` (SVG editável) |
| **Link compartilhável dos wireframes (Figma ou outra ferramenta)** | ⏳ | Não existe link: o Figma exigiu login que não foi concluído. Importe `docs/wireframes/svg/*.svg` no Figma e cole o link no README e no artigo |
| Cadastro, edição, exclusão e pesquisa para **todas as entidades** | ✅ | Fabricantes, Categorias, Clientes, Veículos e Aluguéis (telas em `frontend/src/pages`) |
| Filtros personalizados em **pelo menos dois campos por entidade** | ✅ | Fabricante/Categoria: código e nome · Cliente: nome, CPF, e-mail · Veículo: placa, modelo, fabricante, categoria, disponibilidade · Aluguel: cliente, veículo, situação, período |
| Funcionalidades/visualizações que usam as consultas do banco | ✅ | Veículos disponíveis, veículos por fabricante, clientes sem aluguéis, aluguéis por período, histórico por cliente |
| Utiliza as rotas criadas na etapa 3 do TP1 | ✅ | Todas as rotas `/filtro/...` são chamadas pelo frontend (ver README) |
| Desenvolve as telas previstas nos wireframes | ✅ | Wireframes e telas descrevem os mesmos elementos; comparação no artigo |
| Front-end em HTML/CSS/JavaScript (frameworks permitidos) | ✅ | React + TypeScript + Vite, CSS próprio |
| Pasta específica do front-end na estrutura do TP1 | ✅ | `frontend/` na raiz do repositório |
| Sem dados estáticos/mocados na aplicação | ✅ | Tudo vem da API real; mocks só nos testes automatizados |
| Relatório (LaTeX, DOCX ou PDF) no modelo SBC | ✅ ⚠️ | `docs/artigo/artigo.pdf` (19 páginas, conferido visualmente) + `.tex` e `.docx`. Não há LaTeX instalado: o PDF foi impresso pelo Edge a partir de uma versão HTML do mesmo conteúdo (`gerar_artigo.py` + `npm run artigo:pdf`); o `.tex` **não foi compilado** e o `.docx` **não foi conferido no Word** (a exportação travou) |
| Vídeo de 3 a 5 minutos (pitch) | ⏳ | Roteiro pronto em `docs/roteiro-video.md`; **a gravação é sua** |
| Repositório no GitHub com commits constantes | ⏳ | Histórico local pronto (commits pequenos). Falta criar o repositório no GitHub e fazer o push |
| `.zip` com todos os artefatos | ✅ | `../LocadoraVeiculos-entrega.zip` (fora da pasta do repositório; sem `node_modules`, `bin`, `obj`, logs ou banco) |

## O que você precisa preencher

- [ ] `[PREENCHER: nome do aluno]`, `[PREENCHER: instituição]`, `[PREENCHER: disciplina]` — no artigo (`artigo.tex` e `artigo.docx`/`.pdf`) e no README.
- [ ] `[PREENCHER: link do Figma]` — após importar os SVGs de `docs/wireframes/svg/`.
- [ ] `[PREENCHER: URL do repositório]` — README e artigo.
- [ ] Se o professor/curso exigir: matrícula e e-mail do autor (campos do cabeçalho SBC).

Depois de preencher, **regenere os arquivos**: edite os campos em `docs/artigo/conteudo.py` (`AUTOR`, `INSTITUICAO`, `EMAIL`, `DISCIPLINA` e o link do Figma) e execute
`python gerar_artigo.py` (em `docs/artigo/`) seguido de `npm run artigo:pdf` (em `frontend/`, com `PW_CHANNEL=msedge` se quiser usar o Edge). Alternativas: compilar o `.tex` com
`pdflatex` + `bibtex` (coloque `sbc-template.sty` e `sbc.bst` do modelo oficial da SBC em `docs/artigo/`) ou abrir o `.docx` no Word e *Salvar como PDF*.
⚠️ Se o Word ainda estiver com o `artigo.docx` aberto (um processo oculto iniciado durante a exportação), o `.docx` não será regravado: feche o Word antes.

## Antes de enviar

- [ ] Gravar o vídeo seguindo `docs/roteiro-video.md` (3–5 minutos) e enviá-lo ao Canvas.
- [ ] Criar o repositório no GitHub, vincular e enviar:
  ```powershell
  git remote add origin <URL-do-seu-repositorio>
  git push -u origin main
  ```
  (nenhum `push` foi feito; confira que não há segredos antes de publicar)
- [ ] Rodar uma última vez: `dotnet build`, `cd frontend && npm test && npm run build` (e, com a API no ar, `npm run test:e2e`).
- [ ] Conferir que o ZIP contém: `Controllers/`, `Models/`, `Dtos/`, `Data/`, `Migrations/`, `frontend/` (sem `node_modules`), `docs/`, `README.md`,
      `Program.cs`, `appsettings.json`, `LocadoraVeiculosApi.csproj` e `dotnet-tools.json`.
- [ ] Anexar ao Canvas: relatório (PDF), ZIP e, se pedido, o link do vídeo.

## Segurança e privacidade

- [x] Nenhuma senha, token ou segredo no repositório. O `appsettings.json` usa autenticação integrada do Windows (sem usuário/senha).
- [x] Dados de demonstração **fictícios** (nomes inventados, e-mails `@exemplo.test`, CPFs gerados só com dígitos verificadores válidos, placas inventadas).
- [x] Nenhum banco local (`.mdf`, `.ldf`, `.bak`) no ZIP.
- [x] Nenhuma imagem, ícone ou texto de terceiros: o logotipo, os ícones e os wireframes foram desenhados para este projeto.
