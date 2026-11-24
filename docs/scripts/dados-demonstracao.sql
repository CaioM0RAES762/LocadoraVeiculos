/*
  Dados FICTÍCIOS de demonstração — Locadora de Veículos (Trabalho Prático 2)

  - Nomes, CPFs (gerados apenas com dígitos verificadores válidos), e-mails (@exemplo.test) e placas são inventados.
  - Os aluguéis usam datas RELATIVAS à data de execução, então sempre existem aluguéis devolvidos,
    em andamento e atrasados, o que facilita a demonstração dos filtros.
  - O script é idempotente: pode ser executado mais de uma vez sem duplicar registros.
  - Para remover os dados, execute docs/scripts/limpar-demonstracao.sql.

  Uso (ajuste o servidor/instância conforme o seu ambiente):
    sqlcmd -S .\SQLEXPRESS -E -C -d LocadoraVeiculosDb -f 65001 -i docs\scripts\dados-demonstracao.sql
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- Fabricantes
INSERT INTO Fabricantes (Nome)
SELECT v.Nome FROM (VALUES (N'Fiat'), (N'Volkswagen'), (N'Chevrolet'), (N'Toyota'), (N'Hyundai'), (N'Renault')) AS v(Nome)
WHERE NOT EXISTS (SELECT 1 FROM Fabricantes f WHERE f.Nome = v.Nome);

-- Categorias
INSERT INTO Categorias (Nome)
SELECT v.Nome FROM (VALUES (N'Econômico'), (N'Sedã'), (N'SUV'), (N'Utilitário'), (N'Premium')) AS v(Nome)
WHERE NOT EXISTS (SELECT 1 FROM Categorias c WHERE c.Nome = v.Nome);

-- Clientes (Gustavo e Isadora ficam sem aluguéis para a consulta "clientes sem aluguéis")
INSERT INTO Clientes (Nome, Cpf, Email)
SELECT v.Nome, v.Cpf, v.Email
FROM (VALUES
    (N'Mariana Albuquerque', N'10203040570', N'mariana.albuquerque@exemplo.test'),
    (N'Rafael Tavares',      N'21436587964', N'rafael.tavares@exemplo.test'),
    (N'Beatriz Nogueira',    N'30507090144', N'beatriz.nogueira@exemplo.test'),
    (N'Henrique Matos',      N'41829364502', N'henrique.matos@exemplo.test'),
    (N'Luiza Cordeiro',      N'52738491600', N'luiza.cordeiro@exemplo.test'),
    (N'Otávio Resende',      N'63947182546', N'otavio.resende@exemplo.test'),
    (N'Camila Furtado',      N'74185296355', N'camila.furtado@exemplo.test'),
    (N'Gustavo Pimentel',    N'85296314719', N'gustavo.pimentel@exemplo.test'),
    (N'Isadora Valente',     N'96314725828', N'isadora.valente@exemplo.test')
) AS v(Nome, Cpf, Email)
WHERE NOT EXISTS (SELECT 1 FROM Clientes c WHERE c.Cpf = v.Cpf OR c.Email = v.Email);

-- Veículos
INSERT INTO Veiculos (Placa, Modelo, AnoFabricacao, Quilometragem, FabricanteId, CategoriaId)
SELECT v.Placa, v.Modelo, v.Ano, v.Km, f.Id, c.Id
FROM (VALUES
    (N'ABC1D23', N'Mobi',    2023, 18500, N'Fiat',       N'Econômico'),
    (N'FGH2E34', N'Argo',    2022, 32400, N'Fiat',       N'Econômico'),
    (N'JKL3F45', N'Toro',    2023, 21000, N'Fiat',       N'Utilitário'),
    (N'MNO4G56', N'Polo',    2024,  9800, N'Volkswagen', N'Econômico'),
    (N'PQR5H67', N'Virtus',  2023, 27150, N'Volkswagen', N'Sedã'),
    (N'STU6I78', N'T-Cross', 2024, 12300, N'Volkswagen', N'SUV'),
    (N'WXY6S78', N'Jetta',   2024,  7400, N'Volkswagen', N'Premium'),
    (N'VWX7J89', N'Onix',    2022, 41200, N'Chevrolet',  N'Econômico'),
    (N'YZA8K90', N'Tracker', 2023, 19800, N'Chevrolet',  N'SUV'),
    (N'BCD9L01', N'Corolla', 2024, 15600, N'Toyota',     N'Sedã'),
    (N'EFG0M12', N'Hilux',   2023, 38900, N'Toyota',     N'Utilitário'),
    (N'HIJ1N23', N'HB20',    2022, 36400, N'Hyundai',    N'Econômico'),
    (N'KLM2O34', N'Creta',   2024, 11200, N'Hyundai',    N'SUV'),
    (N'NOP3P45', N'Kwid',    2023, 22700, N'Renault',    N'Econômico'),
    (N'QRS4Q56', N'Duster',  2023, 29900, N'Renault',    N'SUV')
) AS v(Placa, Modelo, Ano, Km, Fabricante, Categoria)
JOIN Fabricantes f ON f.Nome = v.Fabricante
JOIN Categorias c ON c.Nome = v.Categoria
WHERE NOT EXISTS (SELECT 1 FROM Veiculos x WHERE x.Placa = v.Placa);

-- Aluguéis: dias de início relativos a hoje (negativo = no passado).
-- DiasUsados NULL significa aluguel em aberto (sem devolução).
DECLARE @hoje DATETIME2(0) = DATEADD(HOUR, 9, CAST(CAST(SYSDATETIME() AS DATE) AS DATETIME2(0)));

DECLARE @alugueis TABLE (
    Cpf NVARCHAR(11), Placa NVARCHAR(10), DiasInicio INT, DiasPrevistos INT,
    DiasUsados INT NULL, KmInicial INT, KmRodado INT NULL, Diaria DECIMAL(10,2));

INSERT INTO @alugueis VALUES
    (N'10203040570', N'ABC1D23', -92, 5, 5, 17720, 780, 119.90),
    (N'21436587964', N'FGH2E34', -80, 3, 3, 31990, 410, 129.90),
    (N'30507090144', N'PQR5H67', -64, 7, 8, 25830, 1320, 159.90),
    (N'41829364502', N'YZA8K90', -50, 4, 4, 19280, 520, 189.90),
    (N'52738491600', N'BCD9L01', -41, 10, 10, 13750, 1850, 219.90),
    (N'10203040570', N'NOP3P45', -33, 2, 2, 22510, 190, 99.90),
    (N'63947182546', N'EFG0M12', -27, 6, 6, 37960, 940, 289.90),
    (N'74185296355', N'HIJ1N23', -21, 3, 3, 36040, 360, 124.90),
    (N'21436587964', N'STU6I78', -14, 5, 5, 11600, 700, 179.90),
    (N'30507090144', N'MNO4G56', -9, 4, 4, 9320, 480, 134.90),
    (N'52738491600', N'VWX7J89', -6, 2, 2, 40970, 230, 109.90),
    -- Em andamento (fim previsto no futuro)
    (N'41829364502', N'JKL3F45', -2, 7, NULL, 21000, NULL, 199.90),
    (N'63947182546', N'KLM2O34', -1, 4, NULL, 11200, NULL, 169.90),
    (N'74185296355', N'QRS4Q56', -3, 5, NULL, 29900, NULL, 164.90),
    -- Atrasados (fim previsto já passou e não houve devolução)
    (N'21436587964', N'WXY6S78', -9, 5, NULL, 7400, NULL, 249.90),
    (N'30507090144', N'FGH2E34', -6, 4, NULL, 32400, NULL, 129.90);

INSERT INTO Alugueis (ClienteId, VeiculoId, DataInicio, DataFimPrevista, DataDevolucao,
                      QuilometragemInicial, QuilometragemFinal, ValorDiaria, ValorTotal)
SELECT c.Id, v.Id,
       DATEADD(DAY, a.DiasInicio, @hoje),
       DATEADD(DAY, a.DiasInicio + a.DiasPrevistos, @hoje),
       CASE WHEN a.DiasUsados IS NULL THEN NULL ELSE DATEADD(DAY, a.DiasInicio + a.DiasUsados, @hoje) END,
       a.KmInicial,
       CASE WHEN a.DiasUsados IS NULL THEN NULL ELSE a.KmInicial + a.KmRodado END,
       a.Diaria,
       -- Mesma regra da API: cada dia iniciado conta como uma diária (mínimo de uma).
       CASE WHEN a.DiasUsados IS NULL THEN NULL ELSE CASE WHEN a.DiasUsados < 1 THEN 1 ELSE a.DiasUsados END * a.Diaria END
FROM @alugueis a
JOIN Clientes c ON c.Cpf = a.Cpf
JOIN Veiculos v ON v.Placa = a.Placa
WHERE NOT EXISTS (SELECT 1 FROM Alugueis x WHERE x.ClienteId = c.Id AND x.VeiculoId = v.Id);

COMMIT TRANSACTION;

SELECT 'Fabricantes' AS Tabela, COUNT(*) AS Total FROM Fabricantes
UNION ALL SELECT 'Categorias', COUNT(*) FROM Categorias
UNION ALL SELECT 'Clientes', COUNT(*) FROM Clientes
UNION ALL SELECT 'Veiculos', COUNT(*) FROM Veiculos
UNION ALL SELECT 'Alugueis', COUNT(*) FROM Alugueis;
