# Documentação das APIs — Locadora de Veículos

API RESTful em ASP.NET Core (.NET 9) com Entity Framework Core e SQL Server Express.

## Como executar

```powershell
dotnet restore
dotnet ef database update
dotnet run
```

- URL base: `http://localhost:5000`
- Swagger UI: `http://localhost:5000/swagger`
- Especificação OpenAPI: `http://localhost:5000/swagger/v1/swagger.json`

## Convenções gerais

- Requisições e respostas usam JSON (`Content-Type: application/json`).
- As rotas seguem o nome do controller (`/api/Fabricantes`, `/api/Veiculos`...). O roteamento não diferencia maiúsculas de minúsculas, então `/api/fabricantes` também funciona.
- O parâmetro `{id}` é um número inteiro. Um valor não numérico (ex.: `/api/Fabricantes/abc`) não corresponde a nenhuma rota e retorna `404 Not Found`.
- O corpo dos métodos POST e PUT é validado antes da execução do endpoint. Por isso, um PUT com corpo inválido retorna `400` mesmo que o `id` não exista.

### Formatos de erro

| Situação | Formato |
| --- | --- |
| Validação de dados (campos obrigatórios, tamanhos, formatos, JSON malformado, corpo vazio, parâmetro obrigatório ausente) | `400` com `ValidationProblemDetails`: `{ "type", "title", "status", "errors": { "Campo": ["mensagem"] }, "traceId" }` |
| Regras verificadas no código (registro não encontrado, referência inexistente, duplicidade, vínculos) | `{ "mensagem": "texto explicativo" }` com o código correspondente (`400`, `404` ou `409`) |

### Respostas comuns a todos os endpoints

| Código | Quando ocorre |
| --- | --- |
| 500 Internal Server Error | Falha inesperada, por exemplo banco de dados indisponível. Corpo: `{ "mensagem": "Ocorreu um erro inesperado ao processar a requisição." }` |
| 405 Method Not Allowed | Método HTTP não suportado pela rota (ex.: `PATCH /api/Fabricantes/1`). |
| 415 Unsupported Media Type | POST ou PUT enviado sem `Content-Type: application/json`. |

Além disso, nas operações de escrita, se uma restrição do banco (chave estrangeira, CHECK ou índice único) for violada depois das verificações do código — por exemplo, duas requisições simultâneas cadastrando o mesmo nome — a API responde `409 Conflict` com `{ "mensagem": "A operação viola uma restrição de integridade do banco de dados." }`.

## Resumo dos endpoints

| # | Método | Rota | Finalidade | Códigos de resposta |
| --- | --- | --- | --- | --- |
| 1 | GET | `/api/Fabricantes` | Listar fabricantes | 200 |
| 2 | GET | `/api/Fabricantes/{id}` | Consultar fabricante | 200, 404 |
| 3 | POST | `/api/Fabricantes` | Cadastrar fabricante | 201, 400, 409 |
| 4 | PUT | `/api/Fabricantes/{id}` | Atualizar fabricante | 204, 400, 404, 409 |
| 5 | DELETE | `/api/Fabricantes/{id}` | Excluir fabricante | 204, 404, 409 |
| 6 | GET | `/api/Categorias` | Listar categorias | 200 |
| 7 | GET | `/api/Categorias/{id}` | Consultar categoria | 200, 404 |
| 8 | POST | `/api/Categorias` | Cadastrar categoria | 201, 400, 409 |
| 9 | PUT | `/api/Categorias/{id}` | Atualizar categoria | 204, 400, 404, 409 |
| 10 | DELETE | `/api/Categorias/{id}` | Excluir categoria | 204, 404, 409 |
| 11 | GET | `/api/Clientes` | Listar clientes | 200 |
| 12 | GET | `/api/Clientes/{id}` | Consultar cliente | 200, 404 |
| 13 | POST | `/api/Clientes` | Cadastrar cliente | 201, 400, 409 |
| 14 | PUT | `/api/Clientes/{id}` | Atualizar cliente | 204, 400, 404, 409 |
| 15 | DELETE | `/api/Clientes/{id}` | Excluir cliente | 204, 404, 409 |
| 16 | GET | `/api/Clientes/filtro/sem-alugueis` | Filtro: clientes sem aluguéis | 200 |
| 17 | GET | `/api/Veiculos` | Listar veículos | 200 |
| 18 | GET | `/api/Veiculos/{id}` | Consultar veículo | 200, 404 |
| 19 | POST | `/api/Veiculos` | Cadastrar veículo | 201, 400, 409 |
| 20 | PUT | `/api/Veiculos/{id}` | Atualizar veículo | 204, 400, 404, 409 |
| 21 | DELETE | `/api/Veiculos/{id}` | Excluir veículo | 204, 404, 409 |
| 22 | GET | `/api/Veiculos/filtro/fabricante?nome=` | Filtro: veículos por fabricante | 200, 400 |
| 23 | GET | `/api/Veiculos/filtro/disponiveis` | Filtro: veículos disponíveis | 200 |
| 24 | GET | `/api/Alugueis` | Listar aluguéis | 200 |
| 25 | GET | `/api/Alugueis/{id}` | Consultar aluguel | 200, 404 |
| 26 | POST | `/api/Alugueis` | Cadastrar aluguel | 201, 400, 409 |
| 27 | PUT | `/api/Alugueis/{id}` | Atualizar aluguel / registrar devolução | 204, 400, 404, 409 |
| 28 | DELETE | `/api/Alugueis/{id}` | Excluir aluguel | 204, 404 |
| 29 | GET | `/api/Alugueis/filtro/cliente/{clienteId}` | Filtro: aluguéis de um cliente | 200, 404 |
| 30 | GET | `/api/Alugueis/filtro/periodo?inicio=&fim=` | Filtro: aluguéis por período | 200, 400 |

Todos os endpoints também podem retornar `500` e, nos casos descritos em "Respostas comuns", `405` ou `415`.

---

## Fabricantes

Representação retornada:

```json
{ "id": 7, "nome": "Toyota" }
```

Corpo aceito em POST e PUT (`FabricanteDto`):

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `nome` | string | Sim | Máximo de 100 caracteres. Não pode repetir o nome de outro fabricante. |

### GET /api/Fabricantes

- **Método:** GET
- **Finalidade:** lista todos os fabricantes, ordenados por nome.
- **Parâmetros:** nenhum.
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Lista de fabricantes (pode ser vazia: `[]`). |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Fabricantes/{id}

- **Método:** GET
- **Finalidade:** retorna um fabricante pelo identificador.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Fabricante encontrado. |
| 404 Not Found | `{ "mensagem": "Fabricante não encontrado." }` |
| 500 Internal Server Error | Erro inesperado. |

### POST /api/Fabricantes

- **Método:** POST
- **Finalidade:** cadastra um fabricante.
- **Parâmetros:** nenhum.
- **Corpo:**

```json
{ "nome": "Toyota" }
```

| Código | Situação |
| --- | --- |
| 201 Created | Fabricante criado. Retorna o registro e o cabeçalho `Location` com a URL do novo recurso. |
| 400 Bad Request | Nome ausente, vazio ou com mais de 100 caracteres; JSON inválido. |
| 409 Conflict | `{ "mensagem": "Já existe um fabricante com este nome." }` |
| 500 Internal Server Error | Erro inesperado. |

### PUT /api/Fabricantes/{id}

- **Método:** PUT
- **Finalidade:** altera o nome de um fabricante.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:**

```json
{ "nome": "Toyota Motor" }
```

| Código | Situação |
| --- | --- |
| 204 No Content | Fabricante atualizado (sem corpo de resposta). |
| 400 Bad Request | Corpo inválido (mesmas regras do POST). |
| 404 Not Found | `{ "mensagem": "Fabricante não encontrado." }` |
| 409 Conflict | `{ "mensagem": "Já existe um fabricante com este nome." }` |
| 500 Internal Server Error | Erro inesperado. |

### DELETE /api/Fabricantes/{id}

- **Método:** DELETE
- **Finalidade:** exclui um fabricante sem veículos vinculados.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 204 No Content | Fabricante excluído. |
| 404 Not Found | `{ "mensagem": "Fabricante não encontrado." }` |
| 409 Conflict | `{ "mensagem": "Não é possível excluir o fabricante porque existem veículos vinculados a ele." }` |
| 500 Internal Server Error | Erro inesperado. |

---

## Categorias

Representação retornada:

```json
{ "id": 6, "nome": "Sedan" }
```

Corpo aceito em POST e PUT (`CategoriaDto`):

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `nome` | string | Sim | Máximo de 80 caracteres. Não pode repetir o nome de outra categoria. |

### GET /api/Categorias

- **Método:** GET
- **Finalidade:** lista todas as categorias, ordenadas por nome.
- **Parâmetros:** nenhum.
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Lista de categorias (pode ser vazia). |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Categorias/{id}

- **Método:** GET
- **Finalidade:** retorna uma categoria pelo identificador.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Categoria encontrada. |
| 404 Not Found | `{ "mensagem": "Categoria não encontrada." }` |
| 500 Internal Server Error | Erro inesperado. |

### POST /api/Categorias

- **Método:** POST
- **Finalidade:** cadastra uma categoria.
- **Parâmetros:** nenhum.
- **Corpo:**

```json
{ "nome": "Sedan" }
```

| Código | Situação |
| --- | --- |
| 201 Created | Categoria criada, com cabeçalho `Location`. |
| 400 Bad Request | Nome ausente, vazio ou com mais de 80 caracteres; JSON inválido. |
| 409 Conflict | `{ "mensagem": "Já existe uma categoria com este nome." }` |
| 500 Internal Server Error | Erro inesperado. |

### PUT /api/Categorias/{id}

- **Método:** PUT
- **Finalidade:** altera o nome de uma categoria.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:**

```json
{ "nome": "Sedã" }
```

| Código | Situação |
| --- | --- |
| 204 No Content | Categoria atualizada. |
| 400 Bad Request | Corpo inválido (mesmas regras do POST). |
| 404 Not Found | `{ "mensagem": "Categoria não encontrada." }` |
| 409 Conflict | `{ "mensagem": "Já existe uma categoria com este nome." }` |
| 500 Internal Server Error | Erro inesperado. |

### DELETE /api/Categorias/{id}

- **Método:** DELETE
- **Finalidade:** exclui uma categoria sem veículos vinculados.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 204 No Content | Categoria excluída. |
| 404 Not Found | `{ "mensagem": "Categoria não encontrada." }` |
| 409 Conflict | `{ "mensagem": "Não é possível excluir a categoria porque existem veículos vinculados a ela." }` |
| 500 Internal Server Error | Erro inesperado. |

---

## Clientes

Representação retornada:

```json
{ "id": 8, "nome": "Maria Exemplo", "cpf": "11122233344", "email": "maria.exemplo@teste.com" }
```

Corpo aceito em POST e PUT (`ClienteDto`):

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `nome` | string | Sim | Máximo de 120 caracteres. |
| `cpf` | string | Sim | Exatamente 11 dígitos numéricos, sem pontos ou traço. Não pode repetir o CPF de outro cliente. |
| `email` | string | Sim | Formato de e-mail válido, máximo de 150 caracteres. Não pode repetir o e-mail de outro cliente. |

### GET /api/Clientes

- **Método:** GET
- **Finalidade:** lista todos os clientes, ordenados por nome.
- **Parâmetros:** nenhum.
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Lista de clientes (pode ser vazia). |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Clientes/{id}

- **Método:** GET
- **Finalidade:** retorna um cliente pelo identificador.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Cliente encontrado. |
| 404 Not Found | `{ "mensagem": "Cliente não encontrado." }` |
| 500 Internal Server Error | Erro inesperado. |

### POST /api/Clientes

- **Método:** POST
- **Finalidade:** cadastra um cliente.
- **Parâmetros:** nenhum.
- **Corpo:**

```json
{
  "nome": "Maria Exemplo",
  "cpf": "11122233344",
  "email": "maria.exemplo@teste.com"
}
```

| Código | Situação |
| --- | --- |
| 201 Created | Cliente criado, com cabeçalho `Location`. |
| 400 Bad Request | Campo obrigatório ausente; CPF fora do padrão de 11 dígitos; e-mail inválido; tamanho máximo excedido; JSON inválido. |
| 409 Conflict | `{ "mensagem": "Já existe um cliente cadastrado com este CPF." }` ou `{ "mensagem": "Já existe um cliente cadastrado com este e-mail." }` |
| 500 Internal Server Error | Erro inesperado. |

### PUT /api/Clientes/{id}

- **Método:** PUT
- **Finalidade:** atualiza os dados de um cliente.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** mesmos campos do POST.

```json
{
  "nome": "Maria Exemplo da Silva",
  "cpf": "11122233344",
  "email": "maria.silva@teste.com"
}
```

| Código | Situação |
| --- | --- |
| 204 No Content | Cliente atualizado. |
| 400 Bad Request | Corpo inválido (mesmas regras do POST). |
| 404 Not Found | `{ "mensagem": "Cliente não encontrado." }` |
| 409 Conflict | CPF ou e-mail já usado por outro cliente (mesmas mensagens do POST). |
| 500 Internal Server Error | Erro inesperado. |

### DELETE /api/Clientes/{id}

- **Método:** DELETE
- **Finalidade:** exclui um cliente sem aluguéis vinculados.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 204 No Content | Cliente excluído. |
| 404 Not Found | `{ "mensagem": "Cliente não encontrado." }` |
| 409 Conflict | `{ "mensagem": "Não é possível excluir o cliente porque existem aluguéis vinculados a ele." }` |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Clientes/filtro/sem-alugueis

- **Método:** GET
- **Finalidade:** lista os clientes que nunca realizaram aluguel, ordenados por nome.
- **Parâmetros:** nenhum.
- **Corpo:** não possui.
- **Implementação:** LEFT JOIN entre `Clientes` e `Alugueis`, mantendo apenas os clientes sem aluguel correspondente.

Exemplo de resposta:

```json
[
  { "id": 10, "nome": "Ana Ficticia", "cpf": "99988877766", "email": "ana.ficticia@teste.com" }
]
```

| Código | Situação |
| --- | --- |
| 200 OK | Lista de clientes (pode ser vazia). |
| 500 Internal Server Error | Erro inesperado. |

---

## Veículos

Representação retornada:

```json
{
  "id": 10,
  "placa": "TST1A23",
  "modelo": "Corolla",
  "anoFabricacao": 2023,
  "quilometragem": 15000,
  "fabricanteId": 7,
  "fabricante": "Toyota",
  "categoriaId": 6,
  "categoria": "Sedan"
}
```

Corpo aceito em POST e PUT (`VeiculoDto`):

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `placa` | string | Sim | Formato `ABC1234`, `ABC-1234` ou `ABC1D23` (Mercosul). É gravada em maiúsculas e sem hífen. Não pode repetir a placa de outro veículo. |
| `modelo` | string | Sim | Máximo de 100 caracteres. |
| `anoFabricacao` | inteiro | Sim | Entre 1900 e o ano atual + 1. |
| `quilometragem` | inteiro | Sim | Maior ou igual a 0. |
| `fabricanteId` | inteiro | Sim | Maior ou igual a 1; o fabricante precisa existir. |
| `categoriaId` | inteiro | Sim | Maior ou igual a 1; a categoria precisa existir. |

### GET /api/Veiculos

- **Método:** GET
- **Finalidade:** lista todos os veículos com o nome do fabricante e da categoria, ordenados por modelo.
- **Parâmetros:** nenhum.
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Lista de veículos (pode ser vazia). |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Veiculos/{id}

- **Método:** GET
- **Finalidade:** retorna um veículo pelo identificador.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Veículo encontrado. |
| 404 Not Found | `{ "mensagem": "Veículo não encontrado." }` |
| 500 Internal Server Error | Erro inesperado. |

### POST /api/Veiculos

- **Método:** POST
- **Finalidade:** cadastra um veículo.
- **Parâmetros:** nenhum.
- **Corpo:**

```json
{
  "placa": "TST1A23",
  "modelo": "Corolla",
  "anoFabricacao": 2023,
  "quilometragem": 15000,
  "fabricanteId": 7,
  "categoriaId": 6
}
```

| Código | Situação |
| --- | --- |
| 201 Created | Veículo criado, com cabeçalho `Location`. |
| 400 Bad Request | Validação dos campos (tabela acima); `{ "mensagem": "O fabricante informado não existe." }`; `{ "mensagem": "A categoria informada não existe." }` |
| 409 Conflict | `{ "mensagem": "Já existe um veículo cadastrado com esta placa." }` |
| 500 Internal Server Error | Erro inesperado. |

### PUT /api/Veiculos/{id}

- **Método:** PUT
- **Finalidade:** atualiza os dados de um veículo.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** mesmos campos do POST.

| Código | Situação |
| --- | --- |
| 204 No Content | Veículo atualizado. |
| 400 Bad Request | Mesmas situações do POST. |
| 404 Not Found | `{ "mensagem": "Veículo não encontrado." }` |
| 409 Conflict | Placa já usada por outro veículo. |
| 500 Internal Server Error | Erro inesperado. |

### DELETE /api/Veiculos/{id}

- **Método:** DELETE
- **Finalidade:** exclui um veículo sem aluguéis vinculados.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 204 No Content | Veículo excluído. |
| 404 Not Found | `{ "mensagem": "Veículo não encontrado." }` |
| 409 Conflict | `{ "mensagem": "Não é possível excluir o veículo porque existem aluguéis vinculados a ele." }` |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Veiculos/filtro/fabricante

- **Método:** GET
- **Finalidade:** lista os veículos cujo nome do fabricante contém o texto informado, ordenados por fabricante e modelo.
- **Parâmetros:** `nome` (query string, texto, obrigatório). Busca parcial; a comparação segue a collation do banco, que por padrão não diferencia maiúsculas de minúsculas.
- **Corpo:** não possui.
- **Implementação:** INNER JOIN entre `Veiculos`, `Fabricantes` e `Categorias`.
- **Exemplo:** `GET /api/Veiculos/filtro/fabricante?nome=Toyota`

| Código | Situação |
| --- | --- |
| 200 OK | Lista de veículos no mesmo formato do GET de veículos (pode ser vazia). |
| 400 Bad Request | Parâmetro `nome` ausente, vazio ou só com espaços (`"Informe o nome do fabricante."`). |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Veiculos/filtro/disponiveis

- **Método:** GET
- **Finalidade:** lista os veículos sem aluguel em andamento (aluguel sem data de devolução), ordenados por modelo.
- **Parâmetros:** nenhum.
- **Corpo:** não possui.
- **Implementação:** LEFT JOIN entre `Veiculos` e os `Alugueis` sem devolução, mantendo apenas os veículos sem correspondência. INNER JOINs com `Fabricantes` e `Categorias` trazem os nomes.

| Código | Situação |
| --- | --- |
| 200 OK | Lista de veículos no mesmo formato do GET de veículos (pode ser vazia). |
| 500 Internal Server Error | Erro inesperado. |

---

## Aluguéis

Representação retornada:

```json
{
  "id": 8,
  "clienteId": 8,
  "cliente": "Maria Exemplo",
  "veiculoId": 10,
  "placa": "TST1A23",
  "modelo": "Corolla",
  "dataInicio": "2026-10-01T09:00:00",
  "dataFimPrevista": "2026-10-04T09:00:00",
  "dataDevolucao": "2026-10-04T08:30:00",
  "quilometragemInicial": 15000,
  "quilometragemFinal": 15380,
  "valorDiaria": 150,
  "valorTotal": 450
}
```

Corpo aceito em POST e PUT (`AluguelDto`):

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `clienteId` | inteiro | Sim | Maior ou igual a 1; o cliente precisa existir. |
| `veiculoId` | inteiro | Sim | Maior ou igual a 1; o veículo precisa existir. |
| `dataInicio` | data/hora | Sim | Formato ISO 8601, ex.: `2026-10-01T09:00:00`. |
| `dataFimPrevista` | data/hora | Sim | Posterior a `dataInicio`. |
| `dataDevolucao` | data/hora | Não | Registra a devolução. Não pode ser anterior a `dataInicio`. |
| `quilometragemInicial` | inteiro | Sim | Maior ou igual a 0. |
| `quilometragemFinal` | inteiro | Não | Obrigatória quando há `dataDevolucao` e só aceita junto com ela. Não pode ser inferior à quilometragem inicial. |
| `valorDiaria` | decimal | Sim | Entre 0,01 e 99.999.999,99. |

O campo `valorTotal` não é enviado: a API calcula quando há devolução. Cada dia iniciado entre `dataInicio` e `dataDevolucao` conta como uma diária, com mínimo de uma, e o total é `diárias × valorDiaria`. Sem devolução, `valorTotal` fica `null`.

### GET /api/Alugueis

- **Método:** GET
- **Finalidade:** lista todos os aluguéis com o nome do cliente e os dados do veículo, do início mais recente para o mais antigo.
- **Parâmetros:** nenhum.
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Lista de aluguéis (pode ser vazia). |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Alugueis/{id}

- **Método:** GET
- **Finalidade:** retorna um aluguel pelo identificador.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 200 OK | Aluguel encontrado. |
| 404 Not Found | `{ "mensagem": "Aluguel não encontrado." }` |
| 500 Internal Server Error | Erro inesperado. |

### POST /api/Alugueis

- **Método:** POST
- **Finalidade:** registra um aluguel. Pode ser enviado sem devolução (aluguel em andamento) ou já com a devolução.
- **Parâmetros:** nenhum.
- **Corpo (aluguel em andamento):**

```json
{
  "clienteId": 9,
  "veiculoId": 12,
  "dataInicio": "2026-10-03T10:00:00",
  "dataFimPrevista": "2026-10-08T10:00:00",
  "quilometragemInicial": 32000,
  "valorDiaria": 130
}
```

- **Corpo (aluguel com devolução):**

```json
{
  "clienteId": 8,
  "veiculoId": 10,
  "dataInicio": "2026-10-01T09:00:00",
  "dataFimPrevista": "2026-10-04T09:00:00",
  "dataDevolucao": "2026-10-04T08:30:00",
  "quilometragemInicial": 15000,
  "quilometragemFinal": 15380,
  "valorDiaria": 150
}
```

| Código | Situação |
| --- | --- |
| 201 Created | Aluguel criado, com `valorTotal` calculado quando há devolução, e cabeçalho `Location`. |
| 400 Bad Request | Validação dos campos (tabela acima); `{ "mensagem": "O cliente informado não existe." }`; `{ "mensagem": "O veículo informado não existe." }`; `{ "mensagem": "O valor total calculado para a locação excede o limite permitido." }` |
| 409 Conflict | Aluguel sem devolução para um veículo que já tem aluguel em andamento: `{ "mensagem": "O veículo informado já possui um aluguel em andamento." }` |
| 500 Internal Server Error | Erro inesperado. |

### PUT /api/Alugueis/{id}

- **Método:** PUT
- **Finalidade:** atualiza um aluguel. Também é usado para registrar a devolução, enviando `dataDevolucao` e `quilometragemFinal`.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** mesmos campos do POST.

| Código | Situação |
| --- | --- |
| 204 No Content | Aluguel atualizado (o `valorTotal` é recalculado). |
| 400 Bad Request | Mesmas situações do POST. |
| 404 Not Found | `{ "mensagem": "Aluguel não encontrado." }` |
| 409 Conflict | Mesma regra do POST, desconsiderando o próprio aluguel. |
| 500 Internal Server Error | Erro inesperado. |

### DELETE /api/Alugueis/{id}

- **Método:** DELETE
- **Finalidade:** exclui um aluguel.
- **Parâmetros:** `id` (rota, inteiro, obrigatório).
- **Corpo:** não possui.

| Código | Situação |
| --- | --- |
| 204 No Content | Aluguel excluído. |
| 404 Not Found | `{ "mensagem": "Aluguel não encontrado." }` |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Alugueis/filtro/cliente/{clienteId}

- **Método:** GET
- **Finalidade:** histórico de aluguéis de um cliente, do mais recente para o mais antigo, com placa, modelo e fabricante do veículo.
- **Parâmetros:** `clienteId` (rota, inteiro, obrigatório).
- **Corpo:** não possui.
- **Implementação:** INNER JOIN entre `Alugueis`, `Veiculos` e `Fabricantes`.

Exemplo de resposta:

```json
[
  {
    "id": 8,
    "veiculoId": 10,
    "placa": "TST1A23",
    "modelo": "Corolla",
    "fabricante": "Toyota Motor",
    "dataInicio": "2026-10-01T09:00:00",
    "dataFimPrevista": "2026-10-04T09:00:00",
    "dataDevolucao": "2026-10-04T08:30:00",
    "quilometragemInicial": 15000,
    "quilometragemFinal": 15380,
    "valorDiaria": 140,
    "valorTotal": 420
  }
]
```

| Código | Situação |
| --- | --- |
| 200 OK | Lista de aluguéis do cliente (vazia se o cliente nunca alugou). |
| 404 Not Found | `{ "mensagem": "Cliente não encontrado." }` |
| 500 Internal Server Error | Erro inesperado. |

### GET /api/Alugueis/filtro/periodo

- **Método:** GET
- **Finalidade:** lista os aluguéis iniciados dentro de um período, ordenados pela data de início. O dia final é incluído por inteiro.
- **Parâmetros:**
  - `inicio` (query string, data, obrigatório), ex.: `2026-10-01`
  - `fim` (query string, data, obrigatório), ex.: `2026-10-31`
- **Corpo:** não possui.
- **Implementação:** INNER JOIN entre `Alugueis`, `Clientes` e `Veiculos`.
- **Exemplo:** `GET /api/Alugueis/filtro/periodo?inicio=2026-10-01&fim=2026-10-31`

Exemplo de item da resposta:

```json
{
  "id": 9,
  "clienteId": 9,
  "cliente": "Joao Teste",
  "veiculoId": 12,
  "placa": "TST3C45",
  "modelo": "Civic",
  "dataInicio": "2026-10-03T10:00:00",
  "dataFimPrevista": "2026-10-08T10:00:00",
  "dataDevolucao": null,
  "valorDiaria": 130,
  "valorTotal": null
}
```

| Código | Situação |
| --- | --- |
| 200 OK | Lista de aluguéis do período (pode ser vazia). |
| 400 Bad Request | `inicio` ou `fim` ausente ou em formato inválido; ou `{ "mensagem": "A data final do período não pode ser anterior à data inicial." }` |
| 500 Internal Server Error | Erro inesperado. |

---

## Extensões da Etapa 2 (integração com o frontend)

As mudanças abaixo foram feitas para a integração com o frontend React e **não quebram** o contrato da Etapa 1: todos os
parâmetros são opcionais e os campos novos apenas acrescentam informação às respostas existentes.

### Filtros opcionais nos `GET` de listagem

Sem parâmetros, cada listagem continua devolvendo todos os registros. Parâmetros de texto usam busca parcial (`LIKE`, sem
diferenciar maiúsculas de minúsculas). Parâmetros numéricos ou de data inválidos retornam `400` (`ValidationProblemDetails`).

| Endpoint | Parâmetros opcionais |
| --- | --- |
| `GET /api/Fabricantes` | `id`, `nome` |
| `GET /api/Categorias` | `id`, `nome` |
| `GET /api/Clientes` | `nome`, `cpf` (pontos e traço são ignorados), `email` |
| `GET /api/Veiculos` | `placa` (hífen ignorado), `modelo`, `fabricanteId`, `categoriaId`, `disponivel` (`true`/`false`) |
| `GET /api/Alugueis` | `clienteId`, `veiculoId`, `situacao` (`EmAndamento`, `Atrasado` ou `Devolvido`), `inicio`, `fim` (datas; filtram pela data de início do aluguel, igual a `/filtro/periodo`) |

Exemplos:

```text
GET /api/Veiculos?placa=abc&fabricanteId=1&disponivel=true
GET /api/Alugueis?clienteId=2&situacao=Atrasado&inicio=2026-11-01&fim=2026-11-30
```

Em `GET /api/Alugueis`, uma `situacao` desconhecida ou `fim` anterior a `inicio` retornam `400` com `{ "mensagem": "..." }`.

### Campos novos nas respostas

| Recurso | Campo | Descrição |
| --- | --- | --- |
| Veículo (`GET`, `POST`, `/filtro/fabricante`, `/filtro/disponiveis`) | `disponivel` (`bool`) | `true` quando o veículo não possui aluguel em aberto (sem devolução). Calculado no banco. |
| Aluguel (`GET`, `POST`, `/filtro/cliente/{id}`, `/filtro/periodo`) | `situacao` (`string`) | `Devolvido` (há data de devolução), `Atrasado` (sem devolução e fim previsto já passou) ou `EmAndamento`. Derivado de `DataDevolucao` e `DataFimPrevista`; não é persistido. |

Os corpos de `POST` e `PUT` **não mudaram**.

### CORS

A API aceita requisições de navegador apenas das origens listadas em `Cors:AllowedOrigins` (`appsettings.json`), por padrão
`http://localhost:5173`/`4173` (Vite em desenvolvimento e `vite preview`). Métodos liberados: `GET`, `POST`, `PUT` e `DELETE`; cabeçalho
liberado: `Content-Type`. Nenhuma origem curinga é aceita. Em desenvolvimento, o frontend usa o proxy do Vite (`/api`), que dispensa CORS;
a política vale quando `VITE_API_URL` aponta diretamente para a API. Os cabeçalhos CORS também são enviados nas respostas de erro
tratadas pelo manipulador global (`409` e `500`), para que o navegador consiga ler a mensagem.

### Configuração do banco em outro ambiente

A cadeia de conexão do `appsettings.json` (instância `.\SQLEXPRESS`) continua sendo o padrão da Etapa 1. Para usar outra instância sem
editar arquivos versionados, defina a variável de ambiente `ConnectionStrings__DefaultConnection`, por exemplo:

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=localhost;Database=LocadoraVeiculosDb;Trusted_Connection=True;TrustServerCertificate=True;"
dotnet ef database update
dotnet run
```
