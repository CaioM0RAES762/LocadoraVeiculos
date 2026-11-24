/*
  Remove SOMENTE os dados fictícios inseridos por docs/scripts/dados-demonstracao.sql
  (identificados por e-mail @exemplo.test, placa e nome). Registros cadastrados manualmente
  com outros valores não são tocados.

    sqlcmd -S .\SQLEXPRESS -E -C -d LocadoraVeiculosDb -f 65001 -i docs\scripts\limpar-demonstracao.sql
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

DELETE a FROM Alugueis a
JOIN Clientes c ON c.Id = a.ClienteId
WHERE c.Email LIKE N'%@exemplo.test';

DELETE FROM Clientes
WHERE Email LIKE N'%@exemplo.test'
  AND Id NOT IN (SELECT ClienteId FROM Alugueis);

DELETE FROM Veiculos
WHERE Placa IN (
    N'ABC1D23', N'FGH2E34', N'JKL3F45', N'MNO4G56', N'PQR5H67', N'STU6I78', N'WXY6S78', N'VWX7J89',
    N'YZA8K90', N'BCD9L01', N'EFG0M12', N'HIJ1N23', N'KLM2O34', N'NOP3P45', N'QRS4Q56')
  AND Id NOT IN (SELECT VeiculoId FROM Alugueis);

DELETE f FROM Fabricantes f
WHERE f.Nome IN (N'Fiat', N'Volkswagen', N'Chevrolet', N'Toyota', N'Hyundai', N'Renault')
  AND NOT EXISTS (SELECT 1 FROM Veiculos v WHERE v.FabricanteId = f.Id);

DELETE c FROM Categorias c
WHERE c.Nome IN (N'Econômico', N'Sedã', N'SUV', N'Utilitário', N'Premium')
  AND NOT EXISTS (SELECT 1 FROM Veiculos v WHERE v.CategoriaId = c.Id);

COMMIT TRANSACTION;
