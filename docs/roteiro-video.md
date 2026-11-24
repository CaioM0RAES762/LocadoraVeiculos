# Roteiro do vídeo (pitch de 3 a 5 minutos)

**Duração alvo: 4 min 30 s.** O enunciado exige entre 3 e 5 minutos, foco nas telas e conteúdo limitado a: o problema, a modelagem adotada e **pelo menos
dois exemplos de consulta (banco e rota) com seus resultados no frontend**. Fale em ritmo natural (~140 palavras por minuto); o texto abaixo tem cerca
de 600 palavras.

> Este arquivo é só o roteiro. O vídeo **não foi gravado** — ele é a parte que ainda depende de você.

## Antes de gravar (preparação)

1. Inicie o SQL Server, rode as migrations e carregue os dados de demonstração (`docs/scripts/dados-demonstracao.sql`). As datas são relativas ao dia em que o script é
   executado: rode-o **no dia da gravação** (ou limpe e rode de novo) para ter aluguéis em andamento e atrasados.
2. Inicie a API (`dotnet run`) e o frontend (`cd frontend && npm run dev`). Confirme `http://localhost:5173` com dados no painel.
3. Abra em abas, nesta ordem: painel · `docs/modelo-conceitual.png` · um wireframe (`docs/wireframes/12-alugueis-lista.png`) ·
   trecho de `Controllers/VeiculosController.cs` (método `FiltrarDisponiveis`) · trecho de `Controllers/AlugueisController.cs` (método `FiltrarPorPeriodo`).
4. Zoom do navegador em 110–125%, resolução 1920×1080, notificações desativadas, nenhuma aba pessoal visível.
5. **Não mostre conteúdo de terceiros** (sites, imagens, músicas). Se usar música ou imagens externas na edição, cite autor, fonte e link na descrição.
6. Ensaie uma vez cronometrando: o roteiro cabe em 4:30 com folga de 30 s.

## Roteiro com tempos

| Tempo | Mostrar na tela | Fala sugerida |
| --- | --- | --- |
| **0:00 – 0:30**<br>Problema | Painel do sistema (`/`) | “Olá, eu sou **Caio Moraes da Silva**. Uma locadora de veículos precisa saber, a qualquer momento, quais carros estão livres, quem está com cada veículo e quando ele deve voltar. Quando isso fica em planilhas, surgem aluguéis conflitantes, devoluções esquecidas e valores errados. Este sistema resolve isso com um banco de dados, uma API e uma interface web.” |
| **0:30 – 1:10**<br>Modelagem | `docs/modelo-conceitual.png`, depois o diagrama de camadas do artigo (ou o menu do sistema) | “O banco SQL Server tem cinco entidades: Fabricante, Categoria, Cliente, Veículo e Aluguel. Um veículo pertence a um fabricante e a uma categoria; um aluguel liga um cliente a um veículo. Há chaves estrangeiras com restrição de exclusão, índices únicos para CPF, e-mail e placa e regras CHECK. O acesso é feito pelo Entity Framework Core em uma API REST em ASP.NET Core, e o frontend em React consome essa API — não há dados simulados.” |
| **1:10 – 1:40**<br>Wireframes e telas | Wireframe `12-alugueis-lista.png` e, em seguida, a tela real `/alugueis` | “Antes de programar eu desenhei wireframes de alta fidelidade de todas as telas. Aqui está o wireframe de aluguéis e a tela implementada: menu lateral, abas para o tipo de consulta, filtros e a tabela. Todas as cinco entidades seguem o mesmo padrão.” |
| **1:40 – 2:30**<br>CRUD | `/fabricantes` → **Novo fabricante** → Salvar vazio (erro) → preencher e salvar → filtrar → editar → excluir um fabricante **com veículos** (erro 409) | “Vou mostrar o CRUD no cadastro de fabricantes. Se eu salvar vazio, o formulário valida o campo. Ao cadastrar, aparece a confirmação e a lista é atualizada. Posso filtrar por código ou nome e editar. Ao excluir, o sistema pede confirmação; se o fabricante tem veículos, a API recusa com conflito e a tela mostra a mensagem — a integridade do banco é preservada.” |
| **2:30 – 3:30**<br>**Consulta 1** — veículos disponíveis | `FiltrarDisponiveis` no código (LEFT JOIN) → Swagger/rota (opcional) → tela **Veículos › Disponíveis** | “Primeira consulta: veículos disponíveis. No banco é um LEFT JOIN entre Veículos e os aluguéis sem devolução; o veículo está livre quando não existe aluguel em aberto. Essa consulta é exposta na rota `GET /api/Veiculos/filtro/disponiveis`. Na tela, a aba Disponíveis mostra a rota chamada e o resultado: 10 veículos prontos para locação. Se eu aluguar um deles, ele deixa de aparecer aqui.” (Clique em **Alugar** em um veículo, salve o aluguel e volte à aba para mostrar que ele sumiu.) |
| **3:30 – 4:20**<br>**Consulta 2** — aluguéis por período + devolução | `FiltrarPorPeriodo` no código (INNER JOIN) → **Aluguéis › Por período** → devolução | “Segunda consulta: aluguéis por período, com INNER JOIN entre Aluguéis, Clientes e Veículos, na rota `GET /api/Alugueis/filtro/periodo`. Informo a data inicial e a final, e a tabela mostra cliente, veículo, datas, situação e valor total. Para um aluguel em aberto, registro a devolução; a API calcula o valor total — cada dia iniciado conta como uma diária — e o frontend apenas exibe o resultado.” |
| **4:20 – 4:30**<br>Encerramento | Painel | “Resultado: CRUD completo das cinco entidades, filtros em todas as telas, consultas SQL visíveis no frontend e testes automatizados, inclusive ponta a ponta com o SQL Server real. Obrigado!” |

## Pontos que precisam aparecer (checagem rápida)

- [ ] O **problema** (por que a locadora precisa do sistema).
- [ ] A **modelagem** (5 entidades, relacionamentos, SQL Server + EF Core + API + React).
- [ ] As **telas**: painel, uma listagem com filtros, um formulário, a confirmação de exclusão.
- [ ] **CRUD** (cadastro, edição, exclusão) com mensagens de sucesso/erro.
- [ ] **Consulta 1**: lógica no banco → rota → tela, com o **resultado** na tela.
- [ ] **Consulta 2**: lógica no banco → rota → tela, com o **resultado** na tela.
- [ ] Duração final entre **3:00 e 5:00**.
- [ ] Nada de conteúdo de terceiros sem referência (autor, fonte e link).

## Trechos de código/SQL para mostrar (equivalentes ao que a API executa)

Veículos disponíveis (`GET /api/Veiculos/filtro/disponiveis`):

```sql
SELECT v.Id, v.Placa, v.Modelo, v.AnoFabricacao, v.Quilometragem, f.Nome AS Fabricante, c.Nome AS Categoria
FROM Veiculos v
LEFT JOIN Alugueis a ON a.VeiculoId = v.Id AND a.DataDevolucao IS NULL
INNER JOIN Fabricantes f ON f.Id = v.FabricanteId
INNER JOIN Categorias c ON c.Id = v.CategoriaId
WHERE a.Id IS NULL
ORDER BY v.Modelo;
```

Aluguéis por período (`GET /api/Alugueis/filtro/periodo?inicio=2026-09-25&fim=2026-11-24`):

```sql
SELECT a.Id, c.Nome AS Cliente, v.Placa, v.Modelo, a.DataInicio, a.DataFimPrevista, a.DataDevolucao, a.ValorDiaria, a.ValorTotal
FROM Alugueis a
INNER JOIN Clientes c ON c.Id = a.ClienteId
INNER JOIN Veiculos v ON v.Id = a.VeiculoId
WHERE a.DataInicio >= '2026-09-25' AND a.DataInicio < '2026-11-25'   -- fim inclusivo: dia seguinte, exclusivo
ORDER BY a.DataInicio;
```

*(Ambas foram executadas no SQL Server e retornaram a mesma quantidade de linhas que a API — 10 e 13 nos dados de demonstração usados nas capturas.)*

## Entrega do vídeo

Exporte em MP4, confira a duração e o áudio, e envie na atividade correspondente do Canvas. Se editar o vídeo, mantenha só o conteúdo permitido; qualquer
inclusão de terceiros precisa de autor, fonte e link.
