# Trabalho Pratico 1 - Etapa 1

Modelagem do banco de dados de uma locadora de veiculos utilizando C#, Entity Framework Core e SQL Server Express.

## Entidades

- Fabricante
- Categoria
- Veiculo
- Cliente
- Aluguel

A entidade `Categoria` e a quinta entidade exigida pelo item 1.5.

## Modelo conceitual

O diagrama esta em `docs/modelo-conceitual.png`.

## Banco de dados

A conexao esta configurada em `appsettings.json` para a instancia `SQLEXPRESS` e banco `LocadoraVeiculosDb`.

A migration inicial ja esta incluida na pasta `Migrations`.

Para aplicar o esquema no SQL Server Express:

```powershell
dotnet restore
dotnet ef database update
```
