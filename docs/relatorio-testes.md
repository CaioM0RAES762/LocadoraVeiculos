# Relatório de Testes — Locadora de Veículos

## 1. Objetivo

Verificar, pela interface do Swagger, o funcionamento de todas as operações da API: o CRUD das entidades Fabricante, Categoria, Cliente, Veículo e Aluguel, os cinco filtros com JOIN e o tratamento de erros. Para cada teste são registrados a chamada, o resultado esperado, o resultado obtido e um print da tela do Swagger.

## 2. Ambiente

| Item | Valor |
| --- | --- |
| Data da execução | 04/10/2026 |
| Sistema operacional | Windows 11 Pro |
| Plataforma | .NET 9 (SDK 9.0.318), ASP.NET Core, Entity Framework Core 9.0.0 |
| Banco de dados | SQL Server 2025 Express, instância `SQLEXPRESS`, banco `LocadoraVeiculosDb` |
| Swagger | Swashbuckle.AspNetCore 9.0.6 (Swagger UI) |
| Navegador | Microsoft Edge 154 |
| URL da API | `http://localhost:5000` |
| URL do Swagger UI | `http://localhost:5000/swagger` |

A visão geral do Swagger com os 30 endpoints da API está em `evidencias/00-swagger-visao-geral.png`.

## 3. Procedimento

1. Banco atualizado com `dotnet ef database update` e API iniciada com `dotnet run`.
2. Swagger UI aberto em `http://localhost:5000/swagger`.
3. Para cada chamada: expandir o endpoint, clicar em **Try it out**, preencher os parâmetros e o corpo, clicar em **Execute** e registrar o print com o comando curl gerado, a URL chamada, o código HTTP e o corpo da resposta.

Os testes seguiram uma ordem que respeita as chaves estrangeiras:

1. **Cadastros (POST):** fabricantes → categorias → clientes → veículos → aluguéis.
2. **Atualizações (PUT):** uma por entidade.
3. **Consultas (GET geral e GET por ID):** executadas depois das atualizações, por isso também confirmam o efeito de cada PUT, que responde 204 sem corpo.
4. **Filtros.**
5. **Validações e erros.**
6. **Exclusões (DELETE):** em ordem inversa às chaves estrangeiras (aluguéis → veículos → clientes → categorias → fabricantes). Esta etapa também removeu todos os dados de teste do banco.

A numeração dos testes segue a organização por entidade. A coluna "Ordem de execução" do resumo indica a sequência real das chamadas.

### Observações sobre os prints

- Os dados utilizados são fictícios.
- Os IDs não começam em 1 porque o banco já havia sido usado em validações anteriores; o SQL Server não reaproveita valores de identidade após exclusões.
- O Swagger UI mostra a indicação *Undocumented* ao lado dos códigos que não estão declarados na especificação OpenAPI gerada, já que os controllers não declaram atributos de resposta. Os códigos possíveis de cada endpoint estão descritos em `documentacao-apis.md`.
- A caixa *Response body* do Swagger UI tem altura limitada e barra de rolagem. Nas respostas em que a caixa apresentou barra de rolagem, há um print complementar com o sufixo `-parte2`, com a mesma resposta rolada até o fim.
- Além dos testes documentados, foram feitas pelo Swagger 16 chamadas de apoio, sem print, para cadastrar os demais dados usados nos filtros e para a limpeza final (seção 6).

## 4. Resumo

- Testes documentados: **36** (36 aprovados, 0 com falha).
- Chamadas realizadas pelo Swagger, incluindo as de apoio: **52**, todas com o código esperado.
- Prints de evidência: **41** arquivos em `docs/evidencias/`.

| Teste | Descrição | Método | Endpoint | Esperado | Obtido | Ordem de execução | Situação |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | Cadastro de fabricante | POST | `/api/Fabricantes` | 201 | 201 | 1 | APROVADO |
| 02 | Atualização de fabricante | PUT | `/api/Fabricantes/{id}` | 204 | 204 | 14 | APROVADO |
| 03 | Listagem de fabricantes | GET | `/api/Fabricantes` | 200 | 200 | 19 | APROVADO |
| 04 | Consulta de fabricante por ID | GET | `/api/Fabricantes/{id}` | 200 | 200 | 20 | APROVADO |
| 05 | Exclusão de fabricante | DELETE | `/api/Fabricantes/{id}` | 204 | 204 | 50 | APROVADO |
| 06 | Cadastro de categoria | POST | `/api/Categorias` | 201 | 201 | 3 | APROVADO |
| 07 | Atualização de categoria | PUT | `/api/Categorias/{id}` | 204 | 204 | 15 | APROVADO |
| 08 | Listagem de categorias | GET | `/api/Categorias` | 200 | 200 | 21 | APROVADO |
| 09 | Consulta de categoria por ID | GET | `/api/Categorias/{id}` | 200 | 200 | 22 | APROVADO |
| 10 | Exclusão de categoria | DELETE | `/api/Categorias/{id}` | 204 | 204 | 48 | APROVADO |
| 11 | Cadastro de cliente | POST | `/api/Clientes` | 201 | 201 | 5 | APROVADO |
| 12 | Atualização de cliente | PUT | `/api/Clientes/{id}` | 204 | 204 | 16 | APROVADO |
| 13 | Listagem de clientes | GET | `/api/Clientes` | 200 | 200 | 23 | APROVADO |
| 14 | Consulta de cliente por ID | GET | `/api/Clientes/{id}` | 200 | 200 | 24 | APROVADO |
| 15 | Exclusão de cliente | DELETE | `/api/Clientes/{id}` | 204 | 204 | 45 | APROVADO |
| 16 | Cadastro de veículo | POST | `/api/Veiculos` | 201 | 201 | 8 | APROVADO |
| 17 | Atualização de veículo | PUT | `/api/Veiculos/{id}` | 204 | 204 | 17 | APROVADO |
| 18 | Listagem de veículos | GET | `/api/Veiculos` | 200 | 200 | 25 | APROVADO |
| 19 | Consulta de veículo por ID | GET | `/api/Veiculos/{id}` | 200 | 200 | 26 | APROVADO |
| 20 | Exclusão de veículo | DELETE | `/api/Veiculos/{id}` | 204 | 204 | 41 | APROVADO |
| 21 | Cadastro de aluguel | POST | `/api/Alugueis` | 201 | 201 | 12 | APROVADO |
| 22 | Atualização de aluguel | PUT | `/api/Alugueis/{id}` | 204 | 204 | 18 | APROVADO |
| 23 | Listagem de aluguéis | GET | `/api/Alugueis` | 200 | 200 | 27 | APROVADO |
| 24 | Consulta de aluguel por ID | GET | `/api/Alugueis/{id}` | 200 | 200 | 28 | APROVADO |
| 25 | Exclusão de aluguel | DELETE | `/api/Alugueis/{id}` | 204 | 204 | 39 | APROVADO |
| 26 | Filtro: veículos por fabricante | GET | `/api/Veiculos/filtro/fabricante` | 200 | 200 | 29 | APROVADO |
| 27 | Filtro: veículos disponíveis | GET | `/api/Veiculos/filtro/disponiveis` | 200 | 200 | 30 | APROVADO |
| 28 | Filtro: aluguéis por cliente | GET | `/api/Alugueis/filtro/cliente/{clienteId}` | 200 | 200 | 31 | APROVADO |
| 29 | Filtro: aluguéis por período | GET | `/api/Alugueis/filtro/periodo` | 200 | 200 | 32 | APROVADO |
| 30 | Filtro: clientes sem aluguéis | GET | `/api/Clientes/filtro/sem-alugueis` | 200 | 200 | 33 | APROVADO |
| 31 | Validação: cliente com CPF e e-mail inválidos | POST | `/api/Clientes` | 400 | 400 | 34 | APROVADO |
| 32 | Erro: veículo com fabricante inexistente | POST | `/api/Veiculos` | 400 | 400 | 35 | APROVADO |
| 33 | Erro: aluguel de veículo já alugado | POST | `/api/Alugueis` | 409 | 409 | 36 | APROVADO |
| 34 | Erro: exclusão de fabricante com veículos | DELETE | `/api/Fabricantes/{id}` | 409 | 409 | 37 | APROVADO |
| 35 | Erro: período com data final anterior à inicial | GET | `/api/Alugueis/filtro/periodo` | 400 | 400 | 38 | APROVADO |
| 36 | Erro: consulta de fabricante excluído | GET | `/api/Fabricantes/{id}` | 404 | 404 | 52 | APROVADO |

## 5. Testes detalhados

### 5.1 Fabricantes

#### Teste 01 — Cadastro de fabricante

- **Método:** POST
- **Endpoint:** `/api/Fabricantes`
- **URL chamada:** `http://localhost:5000/api/Fabricantes`
- **Objetivo:** Cadastrar um novo fabricante.

**Entrada:**

Corpo:

```json
{
  "nome": "Toyota"
}
```

**Resultado esperado:** 201 Created. Fabricante criado com o nome informado.

**Resultado obtido:** 201 Created

**Retorno:**

```json
{
  "id": 9,
  "nome": "Toyota"
}
```

**Evidência:** `evidencias/01-fabricante-post.png`

**Situação:** APROVADO

#### Teste 02 — Atualização de fabricante

- **Método:** PUT
- **Endpoint:** `/api/Fabricantes/{id}`
- **URL chamada:** `http://localhost:5000/api/Fabricantes/9`
- **Objetivo:** Alterar o nome do fabricante cadastrado no teste 01.

**Entrada:**

Parâmetros: `id` = `9`

Corpo:

```json
{
  "nome": "Toyota Motor"
}
```

**Resultado esperado:** 204 No Content. Atualização aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/02-fabricante-put.png`

**Situação:** APROVADO

#### Teste 03 — Listagem de fabricantes

- **Método:** GET
- **Endpoint:** `/api/Fabricantes`
- **URL chamada:** `http://localhost:5000/api/Fabricantes`
- **Objetivo:** Listar os fabricantes cadastrados.

**Entrada:**

Nenhuma (sem parâmetros e sem corpo).

**Resultado esperado:** 200 OK. Lista com os fabricantes cadastrados, ordenada por nome.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 10,
    "nome": "Honda"
  },
  {
    "id": 9,
    "nome": "Toyota Motor"
  }
]
```

**Evidência:** `evidencias/03-fabricante-get.png`

**Situação:** APROVADO

#### Teste 04 — Consulta de fabricante por ID

- **Método:** GET
- **Endpoint:** `/api/Fabricantes/{id}`
- **URL chamada:** `http://localhost:5000/api/Fabricantes/9`
- **Objetivo:** Consultar o fabricante pelo ID e confirmar a alteração do teste 02.

**Entrada:**

Parâmetros: `id` = `9`

**Resultado esperado:** 200 OK. Fabricante com o nome alterado ("Toyota Motor").

**Resultado obtido:** 200 OK

**Retorno:**

```json
{
  "id": 9,
  "nome": "Toyota Motor"
}
```

**Evidência:** `evidencias/04-fabricante-get-id.png`

**Situação:** APROVADO

#### Teste 05 — Exclusão de fabricante

- **Método:** DELETE
- **Endpoint:** `/api/Fabricantes/{id}`
- **URL chamada:** `http://localhost:5000/api/Fabricantes/9`
- **Objetivo:** Excluir o fabricante, depois de excluídos os veículos vinculados a ele.

**Entrada:**

Parâmetros: `id` = `9`

**Resultado esperado:** 204 No Content. Exclusão aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/05-fabricante-delete.png`

**Situação:** APROVADO

### 5.2 Categorias

#### Teste 06 — Cadastro de categoria

- **Método:** POST
- **Endpoint:** `/api/Categorias`
- **URL chamada:** `http://localhost:5000/api/Categorias`
- **Objetivo:** Cadastrar uma nova categoria.

**Entrada:**

Corpo:

```json
{
  "nome": "Sedan"
}
```

**Resultado esperado:** 201 Created. Categoria criada com o nome informado.

**Resultado obtido:** 201 Created

**Retorno:**

```json
{
  "id": 8,
  "nome": "Sedan"
}
```

**Evidência:** `evidencias/06-categoria-post.png`

**Situação:** APROVADO

#### Teste 07 — Atualização de categoria

- **Método:** PUT
- **Endpoint:** `/api/Categorias/{id}`
- **URL chamada:** `http://localhost:5000/api/Categorias/8`
- **Objetivo:** Alterar o nome da categoria cadastrada no teste 06.

**Entrada:**

Parâmetros: `id` = `8`

Corpo:

```json
{
  "nome": "Sedã"
}
```

**Resultado esperado:** 204 No Content. Atualização aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/07-categoria-put.png`

**Situação:** APROVADO

#### Teste 08 — Listagem de categorias

- **Método:** GET
- **Endpoint:** `/api/Categorias`
- **URL chamada:** `http://localhost:5000/api/Categorias`
- **Objetivo:** Listar as categorias cadastradas.

**Entrada:**

Nenhuma (sem parâmetros e sem corpo).

**Resultado esperado:** 200 OK. Lista com as categorias cadastradas, ordenada por nome.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 8,
    "nome": "Sedã"
  },
  {
    "id": 9,
    "nome": "SUV"
  }
]
```

**Evidência:** `evidencias/08-categoria-get.png`

**Situação:** APROVADO

#### Teste 09 — Consulta de categoria por ID

- **Método:** GET
- **Endpoint:** `/api/Categorias/{id}`
- **URL chamada:** `http://localhost:5000/api/Categorias/8`
- **Objetivo:** Consultar a categoria pelo ID e confirmar a alteração do teste 07.

**Entrada:**

Parâmetros: `id` = `8`

**Resultado esperado:** 200 OK. Categoria com o nome alterado ("Sedã").

**Resultado obtido:** 200 OK

**Retorno:**

```json
{
  "id": 8,
  "nome": "Sedã"
}
```

**Evidência:** `evidencias/09-categoria-get-id.png`

**Situação:** APROVADO

#### Teste 10 — Exclusão de categoria

- **Método:** DELETE
- **Endpoint:** `/api/Categorias/{id}`
- **URL chamada:** `http://localhost:5000/api/Categorias/8`
- **Objetivo:** Excluir a categoria, depois de excluídos os veículos vinculados a ela.

**Entrada:**

Parâmetros: `id` = `8`

**Resultado esperado:** 204 No Content. Exclusão aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/10-categoria-delete.png`

**Situação:** APROVADO

### 5.3 Clientes

#### Teste 11 — Cadastro de cliente

- **Método:** POST
- **Endpoint:** `/api/Clientes`
- **URL chamada:** `http://localhost:5000/api/Clientes`
- **Objetivo:** Cadastrar um novo cliente com nome, CPF e e-mail.

**Entrada:**

Corpo:

```json
{
  "nome": "Maria Exemplo",
  "cpf": "11122233344",
  "email": "maria.exemplo@teste.com"
}
```

**Resultado esperado:** 201 Created. Cliente criado com os dados informados.

**Resultado obtido:** 201 Created

**Retorno:**

```json
{
  "id": 11,
  "nome": "Maria Exemplo",
  "cpf": "11122233344",
  "email": "maria.exemplo@teste.com"
}
```

**Evidência:** `evidencias/11-cliente-post.png`

**Situação:** APROVADO

#### Teste 12 — Atualização de cliente

- **Método:** PUT
- **Endpoint:** `/api/Clientes/{id}`
- **URL chamada:** `http://localhost:5000/api/Clientes/11`
- **Objetivo:** Alterar o nome e o e-mail do cliente cadastrado no teste 11.

**Entrada:**

Parâmetros: `id` = `11`

Corpo:

```json
{
  "nome": "Maria Exemplo da Silva",
  "cpf": "11122233344",
  "email": "maria.silva@teste.com"
}
```

**Resultado esperado:** 204 No Content. Atualização aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/12-cliente-put.png`

**Situação:** APROVADO

#### Teste 13 — Listagem de clientes

- **Método:** GET
- **Endpoint:** `/api/Clientes`
- **URL chamada:** `http://localhost:5000/api/Clientes`
- **Objetivo:** Listar os clientes cadastrados.

**Entrada:**

Nenhuma (sem parâmetros e sem corpo).

**Resultado esperado:** 200 OK. Lista com os três clientes cadastrados, ordenada por nome.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 13,
    "nome": "Ana Ficticia",
    "cpf": "99988877766",
    "email": "ana.ficticia@teste.com"
  },
  {
    "id": 12,
    "nome": "Joao Teste",
    "cpf": "55566677788",
    "email": "joao.teste@teste.com"
  },
  {
    "id": 11,
    "nome": "Maria Exemplo da Silva",
    "cpf": "11122233344",
    "email": "maria.silva@teste.com"
  }
]
```

**Evidência:** `evidencias/13-cliente-get.png`

**Situação:** APROVADO

#### Teste 14 — Consulta de cliente por ID

- **Método:** GET
- **Endpoint:** `/api/Clientes/{id}`
- **URL chamada:** `http://localhost:5000/api/Clientes/11`
- **Objetivo:** Consultar o cliente pelo ID e confirmar a alteração do teste 12.

**Entrada:**

Parâmetros: `id` = `11`

**Resultado esperado:** 200 OK. Cliente com nome e e-mail alterados.

**Resultado obtido:** 200 OK

**Retorno:**

```json
{
  "id": 11,
  "nome": "Maria Exemplo da Silva",
  "cpf": "11122233344",
  "email": "maria.silva@teste.com"
}
```

**Evidência:** `evidencias/14-cliente-get-id.png`

**Situação:** APROVADO

#### Teste 15 — Exclusão de cliente

- **Método:** DELETE
- **Endpoint:** `/api/Clientes/{id}`
- **URL chamada:** `http://localhost:5000/api/Clientes/11`
- **Objetivo:** Excluir o cliente, depois de excluído o aluguel vinculado a ele.

**Entrada:**

Parâmetros: `id` = `11`

**Resultado esperado:** 204 No Content. Exclusão aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/15-cliente-delete.png`

**Situação:** APROVADO

### 5.4 Veículos

#### Teste 16 — Cadastro de veículo

- **Método:** POST
- **Endpoint:** `/api/Veiculos`
- **URL chamada:** `http://localhost:5000/api/Veiculos`
- **Objetivo:** Cadastrar um veículo vinculado ao fabricante e à categoria criados anteriormente.

**Entrada:**

Corpo:

```json
{
  "placa": "TST1A23",
  "modelo": "Corolla",
  "anoFabricacao": 2023,
  "quilometragem": 15000,
  "fabricanteId": 9,
  "categoriaId": 8
}
```

**Resultado esperado:** 201 Created. Veículo criado, com os nomes do fabricante e da categoria na resposta.

**Resultado obtido:** 201 Created

**Retorno:**

```json
{
  "id": 14,
  "placa": "TST1A23",
  "modelo": "Corolla",
  "anoFabricacao": 2023,
  "quilometragem": 15000,
  "fabricanteId": 9,
  "fabricante": "Toyota",
  "categoriaId": 8,
  "categoria": "Sedan"
}
```

**Evidência:** `evidencias/16-veiculo-post.png`

**Situação:** APROVADO

#### Teste 17 — Atualização de veículo

- **Método:** PUT
- **Endpoint:** `/api/Veiculos/{id}`
- **URL chamada:** `http://localhost:5000/api/Veiculos/14`
- **Objetivo:** Atualizar a quilometragem do veículo para 15380 km, valor registrado na devolução do aluguel.

**Entrada:**

Parâmetros: `id` = `14`

Corpo:

```json
{
  "placa": "TST1A23",
  "modelo": "Corolla",
  "anoFabricacao": 2023,
  "quilometragem": 15380,
  "fabricanteId": 9,
  "categoriaId": 8
}
```

**Resultado esperado:** 204 No Content. Atualização aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/17-veiculo-put.png`

**Situação:** APROVADO

#### Teste 18 — Listagem de veículos

- **Método:** GET
- **Endpoint:** `/api/Veiculos`
- **URL chamada:** `http://localhost:5000/api/Veiculos`
- **Objetivo:** Listar os veículos cadastrados.

**Entrada:**

Nenhuma (sem parâmetros e sem corpo).

**Resultado esperado:** 200 OK. Lista com os quatro veículos, ordenada por modelo, com nomes de fabricante e categoria.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 16,
    "placa": "TST3C45",
    "modelo": "Civic",
    "anoFabricacao": 2022,
    "quilometragem": 32000,
    "fabricanteId": 10,
    "fabricante": "Honda",
    "categoriaId": 8,
    "categoria": "Sedã"
  },
  {
    "id": 14,
    "placa": "TST1A23",
    "modelo": "Corolla",
    "anoFabricacao": 2023,
    "quilometragem": 15380,
    "fabricanteId": 9,
    "fabricante": "Toyota Motor",
    "categoriaId": 8,
    "categoria": "Sedã"
  },
  {
    "id": 15,
    "placa": "TST2B34",
    "modelo": "Corolla Cross",
    "anoFabricacao": 2024,
    "quilometragem": 8000,
    "fabricanteId": 9,
    "fabricante": "Toyota Motor",
    "categoriaId": 9,
    "categoria": "SUV"
  },
  {
    "id": 17,
    "placa": "TST4D56",
    "modelo": "HR-V",
    "anoFabricacao": 2023,
    "quilometragem": 12000,
    "fabricanteId": 10,
    "fabricante": "Honda",
    "categoriaId": 9,
    "categoria": "SUV"
  }
]
```

**Evidência:** `evidencias/18-veiculo-get.png`, `evidencias/18-veiculo-get-parte2.png`

**Situação:** APROVADO

#### Teste 19 — Consulta de veículo por ID

- **Método:** GET
- **Endpoint:** `/api/Veiculos/{id}`
- **URL chamada:** `http://localhost:5000/api/Veiculos/14`
- **Objetivo:** Consultar o veículo pelo ID e confirmar a alteração do teste 17.

**Entrada:**

Parâmetros: `id` = `14`

**Resultado esperado:** 200 OK. Veículo com quilometragem 15380.

**Resultado obtido:** 200 OK

**Retorno:**

```json
{
  "id": 14,
  "placa": "TST1A23",
  "modelo": "Corolla",
  "anoFabricacao": 2023,
  "quilometragem": 15380,
  "fabricanteId": 9,
  "fabricante": "Toyota Motor",
  "categoriaId": 8,
  "categoria": "Sedã"
}
```

**Evidência:** `evidencias/19-veiculo-get-id.png`

**Situação:** APROVADO

#### Teste 20 — Exclusão de veículo

- **Método:** DELETE
- **Endpoint:** `/api/Veiculos/{id}`
- **URL chamada:** `http://localhost:5000/api/Veiculos/14`
- **Objetivo:** Excluir o veículo, depois de excluído o aluguel vinculado a ele.

**Entrada:**

Parâmetros: `id` = `14`

**Resultado esperado:** 204 No Content. Exclusão aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/20-veiculo-delete.png`

**Situação:** APROVADO

### 5.5 Aluguéis

#### Teste 21 — Cadastro de aluguel

- **Método:** POST
- **Endpoint:** `/api/Alugueis`
- **URL chamada:** `http://localhost:5000/api/Alugueis`
- **Objetivo:** Registrar um aluguel já com devolução e verificar o cálculo do valor total: de 01/10 09:00 a 04/10 08:30 são 3 diárias iniciadas, 3 × 150,00 = 450,00.

**Entrada:**

Corpo:

```json
{
  "clienteId": 11,
  "veiculoId": 14,
  "dataInicio": "2026-10-01T09:00:00",
  "dataFimPrevista": "2026-10-04T09:00:00",
  "dataDevolucao": "2026-10-04T08:30:00",
  "quilometragemInicial": 15000,
  "quilometragemFinal": 15380,
  "valorDiaria": 150
}
```

**Resultado esperado:** 201 Created. Aluguel criado com valorTotal igual a 450.

**Resultado obtido:** 201 Created

**Retorno:**

```json
{
  "id": 10,
  "clienteId": 11,
  "cliente": "Maria Exemplo",
  "veiculoId": 14,
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

**Evidência:** `evidencias/21-aluguel-post.png`

**Situação:** APROVADO

#### Teste 22 — Atualização de aluguel

- **Método:** PUT
- **Endpoint:** `/api/Alugueis/{id}`
- **URL chamada:** `http://localhost:5000/api/Alugueis/10`
- **Objetivo:** Alterar o valor da diária do aluguel do teste 21 para 140,00; o valor total deve ser recalculado.

**Entrada:**

Parâmetros: `id` = `10`

Corpo:

```json
{
  "clienteId": 11,
  "veiculoId": 14,
  "dataInicio": "2026-10-01T09:00:00",
  "dataFimPrevista": "2026-10-04T09:00:00",
  "dataDevolucao": "2026-10-04T08:30:00",
  "quilometragemInicial": 15000,
  "quilometragemFinal": 15380,
  "valorDiaria": 140
}
```

**Resultado esperado:** 204 No Content. Atualização aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/22-aluguel-put.png`

**Situação:** APROVADO

#### Teste 23 — Listagem de aluguéis

- **Método:** GET
- **Endpoint:** `/api/Alugueis`
- **URL chamada:** `http://localhost:5000/api/Alugueis`
- **Objetivo:** Listar os aluguéis cadastrados.

**Entrada:**

Nenhuma (sem parâmetros e sem corpo).

**Resultado esperado:** 200 OK. Lista com os dois aluguéis, do início mais recente para o mais antigo.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 11,
    "clienteId": 12,
    "cliente": "Joao Teste",
    "veiculoId": 16,
    "placa": "TST3C45",
    "modelo": "Civic",
    "dataInicio": "2026-10-03T10:00:00",
    "dataFimPrevista": "2026-10-08T10:00:00",
    "dataDevolucao": null,
    "quilometragemInicial": 32000,
    "quilometragemFinal": null,
    "valorDiaria": 130,
    "valorTotal": null
  },
  {
    "id": 10,
    "clienteId": 11,
    "cliente": "Maria Exemplo da Silva",
    "veiculoId": 14,
    "placa": "TST1A23",
    "modelo": "Corolla",
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

**Evidência:** `evidencias/23-aluguel-get.png`, `evidencias/23-aluguel-get-parte2.png`

**Situação:** APROVADO

#### Teste 24 — Consulta de aluguel por ID

- **Método:** GET
- **Endpoint:** `/api/Alugueis/{id}`
- **URL chamada:** `http://localhost:5000/api/Alugueis/10`
- **Objetivo:** Consultar o aluguel pelo ID e confirmar o recálculo do teste 22 (3 × 140,00 = 420,00).

**Entrada:**

Parâmetros: `id` = `10`

**Resultado esperado:** 200 OK. Aluguel com valorDiaria 140 e valorTotal 420.

**Resultado obtido:** 200 OK

**Retorno:**

```json
{
  "id": 10,
  "clienteId": 11,
  "cliente": "Maria Exemplo da Silva",
  "veiculoId": 14,
  "placa": "TST1A23",
  "modelo": "Corolla",
  "dataInicio": "2026-10-01T09:00:00",
  "dataFimPrevista": "2026-10-04T09:00:00",
  "dataDevolucao": "2026-10-04T08:30:00",
  "quilometragemInicial": 15000,
  "quilometragemFinal": 15380,
  "valorDiaria": 140,
  "valorTotal": 420
}
```

**Evidência:** `evidencias/24-aluguel-get-id.png`

**Situação:** APROVADO

#### Teste 25 — Exclusão de aluguel

- **Método:** DELETE
- **Endpoint:** `/api/Alugueis/{id}`
- **URL chamada:** `http://localhost:5000/api/Alugueis/10`
- **Objetivo:** Excluir o aluguel.

**Entrada:**

Parâmetros: `id` = `10`

**Resultado esperado:** 204 No Content. Exclusão aceita, sem corpo de resposta.

**Resultado obtido:** 204 No Content

**Retorno:**

Sem corpo de resposta.

**Evidência:** `evidencias/25-aluguel-delete.png`

**Situação:** APROVADO

### 5.6 Filtros

#### Teste 26 — Filtro: veículos por fabricante

- **Método:** GET
- **Endpoint:** `/api/Veiculos/filtro/fabricante`
- **URL chamada:** `http://localhost:5000/api/Veiculos/filtro/fabricante?nome=Toyota`
- **Tabelas/JOIN:** INNER JOIN entre Veiculos, Fabricantes e Categorias
- **Objetivo:** Listar os veículos cujo fabricante contém "Toyota".

**Entrada:**

Parâmetros: `nome` = `Toyota`

**Resultado esperado:** 200 OK. Somente os veículos da Toyota: Corolla e Corolla Cross.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 14,
    "placa": "TST1A23",
    "modelo": "Corolla",
    "anoFabricacao": 2023,
    "quilometragem": 15380,
    "fabricanteId": 9,
    "fabricante": "Toyota Motor",
    "categoriaId": 8,
    "categoria": "Sedã"
  },
  {
    "id": 15,
    "placa": "TST2B34",
    "modelo": "Corolla Cross",
    "anoFabricacao": 2024,
    "quilometragem": 8000,
    "fabricanteId": 9,
    "fabricante": "Toyota Motor",
    "categoriaId": 9,
    "categoria": "SUV"
  }
]
```

**Evidência:** `evidencias/26-filtro-veiculos-por-fabricante.png`

**Situação:** APROVADO

#### Teste 27 — Filtro: veículos disponíveis

- **Método:** GET
- **Endpoint:** `/api/Veiculos/filtro/disponiveis`
- **URL chamada:** `http://localhost:5000/api/Veiculos/filtro/disponiveis`
- **Tabelas/JOIN:** LEFT JOIN entre Veiculos e Alugueis sem devolução (INNER JOIN com Fabricantes e Categorias para os nomes)
- **Objetivo:** Listar os veículos sem aluguel em andamento. O Civic está com aluguel em aberto (cliente Joao Teste).

**Entrada:**

Nenhuma (sem parâmetros e sem corpo).

**Resultado esperado:** 200 OK. Corolla, Corolla Cross e HR-V; o Civic não deve aparecer.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 14,
    "placa": "TST1A23",
    "modelo": "Corolla",
    "anoFabricacao": 2023,
    "quilometragem": 15380,
    "fabricanteId": 9,
    "fabricante": "Toyota Motor",
    "categoriaId": 8,
    "categoria": "Sedã"
  },
  {
    "id": 15,
    "placa": "TST2B34",
    "modelo": "Corolla Cross",
    "anoFabricacao": 2024,
    "quilometragem": 8000,
    "fabricanteId": 9,
    "fabricante": "Toyota Motor",
    "categoriaId": 9,
    "categoria": "SUV"
  },
  {
    "id": 17,
    "placa": "TST4D56",
    "modelo": "HR-V",
    "anoFabricacao": 2023,
    "quilometragem": 12000,
    "fabricanteId": 10,
    "fabricante": "Honda",
    "categoriaId": 9,
    "categoria": "SUV"
  }
]
```

**Evidência:** `evidencias/27-filtro-veiculos-disponiveis.png`, `evidencias/27-filtro-veiculos-disponiveis-parte2.png`

**Situação:** APROVADO

#### Teste 28 — Filtro: aluguéis por cliente

- **Método:** GET
- **Endpoint:** `/api/Alugueis/filtro/cliente/{clienteId}`
- **URL chamada:** `http://localhost:5000/api/Alugueis/filtro/cliente/11`
- **Tabelas/JOIN:** INNER JOIN entre Alugueis, Veiculos e Fabricantes
- **Objetivo:** Listar o histórico de aluguéis da cliente Maria Exemplo da Silva.

**Entrada:**

Parâmetros: `clienteId` = `11`

**Resultado esperado:** 200 OK. Somente o aluguel da cliente (Corolla), com placa, modelo e fabricante do veículo.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 10,
    "veiculoId": 14,
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

**Evidência:** `evidencias/28-filtro-alugueis-por-cliente.png`

**Situação:** APROVADO

#### Teste 29 — Filtro: aluguéis por período

- **Método:** GET
- **Endpoint:** `/api/Alugueis/filtro/periodo`
- **URL chamada:** `http://localhost:5000/api/Alugueis/filtro/periodo?inicio=2026-10-01&fim=2026-10-31`
- **Tabelas/JOIN:** INNER JOIN entre Alugueis, Clientes e Veiculos
- **Objetivo:** Listar os aluguéis iniciados entre 01/10/2026 e 31/10/2026.

**Entrada:**

Parâmetros: `inicio` = `2026-10-01`, `fim` = `2026-10-31`

**Resultado esperado:** 200 OK. Os dois aluguéis de outubro (Corolla e Civic), em ordem de data de início, com nome do cliente e dados do veículo.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 10,
    "clienteId": 11,
    "cliente": "Maria Exemplo da Silva",
    "veiculoId": 14,
    "placa": "TST1A23",
    "modelo": "Corolla",
    "dataInicio": "2026-10-01T09:00:00",
    "dataFimPrevista": "2026-10-04T09:00:00",
    "dataDevolucao": "2026-10-04T08:30:00",
    "valorDiaria": 140,
    "valorTotal": 420
  },
  {
    "id": 11,
    "clienteId": 12,
    "cliente": "Joao Teste",
    "veiculoId": 16,
    "placa": "TST3C45",
    "modelo": "Civic",
    "dataInicio": "2026-10-03T10:00:00",
    "dataFimPrevista": "2026-10-08T10:00:00",
    "dataDevolucao": null,
    "valorDiaria": 130,
    "valorTotal": null
  }
]
```

**Evidência:** `evidencias/29-filtro-alugueis-por-periodo.png`, `evidencias/29-filtro-alugueis-por-periodo-parte2.png`

**Situação:** APROVADO

#### Teste 30 — Filtro: clientes sem aluguéis

- **Método:** GET
- **Endpoint:** `/api/Clientes/filtro/sem-alugueis`
- **URL chamada:** `http://localhost:5000/api/Clientes/filtro/sem-alugueis`
- **Tabelas/JOIN:** LEFT JOIN entre Clientes e Alugueis
- **Objetivo:** Listar os clientes que nunca realizaram aluguel.

**Entrada:**

Nenhuma (sem parâmetros e sem corpo).

**Resultado esperado:** 200 OK. Somente a cliente Ana Ficticia.

**Resultado obtido:** 200 OK

**Retorno:**

```json
[
  {
    "id": 13,
    "nome": "Ana Ficticia",
    "cpf": "99988877766",
    "email": "ana.ficticia@teste.com"
  }
]
```

**Evidência:** `evidencias/30-filtro-clientes-sem-alugueis.png`

**Situação:** APROVADO

### 5.7 Validações e tratamento de erros

#### Teste 31 — Validação: cliente com CPF e e-mail inválidos

- **Método:** POST
- **Endpoint:** `/api/Clientes`
- **URL chamada:** `http://localhost:5000/api/Clientes`
- **Objetivo:** Enviar CPF com 3 dígitos e e-mail sem formato válido.

**Entrada:**

Corpo:

```json
{
  "nome": "Cliente Invalido",
  "cpf": "123",
  "email": "email-invalido"
}
```

**Resultado esperado:** 400 Bad Request. Rejeição com as mensagens de validação de CPF e de e-mail.

**Resultado obtido:** 400 Bad Request

**Retorno:**

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Cpf": [
      "O CPF deve conter exatamente 11 dígitos numéricos."
    ],
    "Email": [
      "O e-mail informado não é válido."
    ]
  },
  "traceId": "00-bb1c65823f14d4efb7294e77124768fa-9fb2f1a7a829f483-00"
}
```

**Evidência:** `evidencias/31-erro-cliente-dados-invalidos.png`

**Situação:** APROVADO

#### Teste 32 — Erro: veículo com fabricante inexistente

- **Método:** POST
- **Endpoint:** `/api/Veiculos`
- **URL chamada:** `http://localhost:5000/api/Veiculos`
- **Objetivo:** Cadastrar veículo informando um fabricanteId que não existe (999999).

**Entrada:**

Corpo:

```json
{
  "placa": "TST5E67",
  "modelo": "Yaris",
  "anoFabricacao": 2023,
  "quilometragem": 0,
  "fabricanteId": 999999,
  "categoriaId": 8
}
```

**Resultado esperado:** 400 Bad Request. Rejeição com a mensagem "O fabricante informado não existe."

**Resultado obtido:** 400 Bad Request

**Retorno:**

```json
{
  "mensagem": "O fabricante informado não existe."
}
```

**Evidência:** `evidencias/32-erro-veiculo-fabricante-inexistente.png`

**Situação:** APROVADO

#### Teste 33 — Erro: aluguel de veículo já alugado

- **Método:** POST
- **Endpoint:** `/api/Alugueis`
- **URL chamada:** `http://localhost:5000/api/Alugueis`
- **Objetivo:** Registrar um aluguel em aberto para o Civic, que já possui aluguel em andamento.

**Entrada:**

Corpo:

```json
{
  "clienteId": 13,
  "veiculoId": 16,
  "dataInicio": "2026-10-05T09:00:00",
  "dataFimPrevista": "2026-10-07T09:00:00",
  "quilometragemInicial": 32000,
  "valorDiaria": 130
}
```

**Resultado esperado:** 409 Conflict. Conflito com a mensagem "O veículo informado já possui um aluguel em andamento."

**Resultado obtido:** 409 Conflict

**Retorno:**

```json
{
  "mensagem": "O veículo informado já possui um aluguel em andamento."
}
```

**Evidência:** `evidencias/33-erro-aluguel-veiculo-ocupado.png`

**Situação:** APROVADO

#### Teste 34 — Erro: exclusão de fabricante com veículos

- **Método:** DELETE
- **Endpoint:** `/api/Fabricantes/{id}`
- **URL chamada:** `http://localhost:5000/api/Fabricantes/9`
- **Objetivo:** Excluir o fabricante Toyota Motor enquanto ainda possui veículos cadastrados.

**Entrada:**

Parâmetros: `id` = `9`

**Resultado esperado:** 409 Conflict. Conflito, sem excluir o registro.

**Resultado obtido:** 409 Conflict

**Retorno:**

```json
{
  "mensagem": "Não é possível excluir o fabricante porque existem veículos vinculados a ele."
}
```

**Evidência:** `evidencias/34-erro-fabricante-delete-com-vinculos.png`

**Situação:** APROVADO

#### Teste 35 — Erro: período com data final anterior à inicial

- **Método:** GET
- **Endpoint:** `/api/Alugueis/filtro/periodo`
- **URL chamada:** `http://localhost:5000/api/Alugueis/filtro/periodo?inicio=2026-10-31&fim=2026-10-01`
- **Objetivo:** Consultar o filtro de período com início 31/10/2026 e fim 01/10/2026.

**Entrada:**

Parâmetros: `inicio` = `2026-10-31`, `fim` = `2026-10-01`

**Resultado esperado:** 400 Bad Request. Rejeição com a mensagem sobre a data final.

**Resultado obtido:** 400 Bad Request

**Retorno:**

```json
{
  "mensagem": "A data final do período não pode ser anterior à data inicial."
}
```

**Evidência:** `evidencias/35-erro-periodo-invalido.png`

**Situação:** APROVADO

#### Teste 36 — Erro: consulta de fabricante excluído

- **Método:** GET
- **Endpoint:** `/api/Fabricantes/{id}`
- **URL chamada:** `http://localhost:5000/api/Fabricantes/9`
- **Objetivo:** Consultar pelo ID o fabricante excluído no teste 05, confirmando a exclusão.

**Entrada:**

Parâmetros: `id` = `9`

**Resultado esperado:** 404 Not Found. Não encontrado, com a mensagem "Fabricante não encontrado."

**Resultado obtido:** 404 Not Found

**Retorno:**

```json
{
  "mensagem": "Fabricante não encontrado."
}
```

**Evidência:** `evidencias/36-erro-fabricante-inexistente.png`

**Situação:** APROVADO

## 6. Chamadas de apoio (sem print)

Chamadas feitas pelo Swagger para preparar os dados dos filtros e para a limpeza final do banco.

| Ordem de execução | Método | URL chamada | Dados | Esperado | Obtido |
| --- | --- | --- | --- | --- | --- |
| 2 | POST | `http://localhost:5000/api/Fabricantes` | `{"nome": "Honda"}` | 201 | 201 |
| 4 | POST | `http://localhost:5000/api/Categorias` | `{"nome": "SUV"}` | 201 | 201 |
| 6 | POST | `http://localhost:5000/api/Clientes` | `{"nome": "Joao Teste", "cpf": "55566677788", "email": "joao.teste@teste.com"}` | 201 | 201 |
| 7 | POST | `http://localhost:5000/api/Clientes` | `{"nome": "Ana Ficticia", "cpf": "99988877766", "email": "ana.ficticia@teste.com"}` | 201 | 201 |
| 9 | POST | `http://localhost:5000/api/Veiculos` | `{"placa": "TST2B34", "modelo": "Corolla Cross", "anoFabricacao": 2024, "quilometragem": 8000, "fabricanteId": 9, "categoriaId": 9}` | 201 | 201 |
| 10 | POST | `http://localhost:5000/api/Veiculos` | `{"placa": "TST3C45", "modelo": "Civic", "anoFabricacao": 2022, "quilometragem": 32000, "fabricanteId": 10, "categoriaId": 8}` | 201 | 201 |
| 11 | POST | `http://localhost:5000/api/Veiculos` | `{"placa": "TST4D56", "modelo": "HR-V", "anoFabricacao": 2023, "quilometragem": 12000, "fabricanteId": 10, "categoriaId": 9}` | 201 | 201 |
| 13 | POST | `http://localhost:5000/api/Alugueis` | `{"clienteId": 12, "veiculoId": 16, "dataInicio": "2026-10-03T10:00:00", "dataFimPrevista": "2026-10-08T10:00:00", "quilometragemInicial": 32000, "valorDiaria": 130}` | 201 | 201 |
| 40 | DELETE | `http://localhost:5000/api/Alugueis/11` | `—` | 204 | 204 |
| 42 | DELETE | `http://localhost:5000/api/Veiculos/15` | `—` | 204 | 204 |
| 43 | DELETE | `http://localhost:5000/api/Veiculos/16` | `—` | 204 | 204 |
| 44 | DELETE | `http://localhost:5000/api/Veiculos/17` | `—` | 204 | 204 |
| 46 | DELETE | `http://localhost:5000/api/Clientes/12` | `—` | 204 | 204 |
| 47 | DELETE | `http://localhost:5000/api/Clientes/13` | `—` | 204 | 204 |
| 49 | DELETE | `http://localhost:5000/api/Categorias/9` | `—` | 204 | 204 |
| 51 | DELETE | `http://localhost:5000/api/Fabricantes/10` | `—` | 204 | 204 |

## 7. Conclusão

Todas as operações testadas retornaram o código HTTP esperado:

- o CRUD completo das cinco entidades;
- os cinco filtros, que demonstram INNER JOIN (testes 26, 28 e 29) e LEFT JOIN (testes 27 e 30);
- os casos de validação e erro (400, 404 e 409).

Ao final, os registros de teste foram excluídos pela própria API, deixando o banco vazio.
