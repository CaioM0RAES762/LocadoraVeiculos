import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Capturas de tela REAIS (sem mocks): a aplicação conversa com a API e com o SQL Server.
 * Os dados mostrados são os fictícios de docs/scripts/dados-demonstracao.sql.
 * Para registrar uma devolução sem alterar a demonstração, o teste cria dados temporários "TESTE CAPTURA"
 * e os remove no final.
 */
const destino = resolve(process.cwd(), '../docs/evidencias/frontend');
mkdirSync(destino, { recursive: true });

const dia = (deslocamento: number) => {
  const d = new Date();
  d.setDate(d.getDate() + deslocamento);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

async function capturar(page: Page, nome: string) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: resolve(destino, `${nome}.png`) });
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL });
  const resposta = await api.get('/api/Clientes').catch(() => null);
  if (!resposta?.ok()) throw new Error('API indisponível: inicie o backend (dotnet run) antes de gerar as capturas.');
  const total = ((await resposta.json()) as unknown[]).length;
  if (total < 5) throw new Error('Carregue os dados de demonstração (docs/scripts/dados-demonstracao.sql) antes de gerar as capturas.');
  await api.dispose();
});

test('painel e cadastros simples', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Indicadores' }).getByRole('link', { name: /Veículos disponíveis/ })).toBeVisible();
  await expect(page.getByRole('table', { name: /Aluguéis em aberto/ })).toBeVisible();
  await capturar(page, '01-painel');

  await page.goto('/fabricantes');
  await expect(page.getByRole('cell', { name: 'Fiat', exact: true })).toBeVisible();
  await capturar(page, '02-fabricantes-lista');

  await page.getByRole('search', { name: 'Filtrar fabricantes' }).getByLabel('Nome').fill('vol');
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page.getByRole('cell', { name: 'Volkswagen', exact: true })).toBeVisible();
  await capturar(page, '03-fabricantes-filtro');

  await page.goto('/fabricantes/novo');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('alert')).toContainText('O nome do fabricante é obrigatório.');
  await capturar(page, '04-fabricantes-validacao');

  await page.goto('/fabricantes');
  await page.getByRole('button', { name: 'Excluir fabricante Fiat' }).click();
  await expect(page.getByRole('dialog', { name: 'Excluir fabricante?' })).toBeVisible();
  await capturar(page, '05-fabricantes-confirmar-exclusao');

  // A exclusão é de fato enviada e a API recusa (409): o fabricante possui veículos vinculados.
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByRole('alert')).toContainText('existem veículos vinculados a ele');
  await capturar(page, '06-fabricantes-conflito-409');

  await page.goto('/categorias');
  await expect(page.getByRole('cell', { name: 'Econômico', exact: true })).toBeVisible();
  await capturar(page, '07-categorias-lista');
});

test('clientes', async ({ page }) => {
  await page.goto('/clientes');
  await expect(page.getByRole('cell', { name: 'Mariana Albuquerque', exact: true })).toBeVisible();
  await capturar(page, '08-clientes-lista');

  await page.getByRole('button', { name: 'Sem aluguéis' }).click();
  await expect(page.getByText('/api/Clientes/filtro/sem-alugueis')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Gustavo Pimentel', exact: true })).toBeVisible();
  await capturar(page, '09-clientes-sem-alugueis');

  await page.goto('/clientes/novo');
  await page.getByLabel(/^Nome completo/).fill('Cliente de Exemplo');
  await page.getByLabel(/^CPF/).fill('12345678909');
  await page.getByLabel(/^E-mail/).fill('cliente.exemplo@exemplo.test');
  await capturar(page, '10-clientes-formulario');
});

test('veículos e consultas de veículos', async ({ page }) => {
  await page.goto('/veiculos');
  await expect(page.getByRole('cell', { name: 'ABC1D23', exact: true })).toBeVisible();
  await capturar(page, '11-veiculos-lista');

  await page.getByRole('search', { name: 'Filtrar veículos' }).getByLabel('Fabricante').selectOption({ label: 'Fiat' });
  await page.getByRole('search', { name: 'Filtrar veículos' }).getByLabel('Disponibilidade').selectOption({ label: 'Disponíveis' });
  await page.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page.getByText(/fabricanteId=\d+&disponivel=true/)).toBeVisible();
  await capturar(page, '12-veiculos-filtros-combinados');

  // Consulta de demonstração 1: veículos disponíveis (LEFT JOIN)
  await page.goto('/veiculos?consulta=disponiveis');
  await expect(page.getByText('/api/Veiculos/filtro/disponiveis')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'BCD9L01', exact: true })).toBeVisible();
  await capturar(page, '13-veiculos-disponiveis');

  await page.goto('/veiculos?consulta=fabricante&nome=Toyota');
  await expect(page.getByText('/api/Veiculos/filtro/fabricante?nome=Toyota')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'BCD9L01', exact: true })).toBeVisible();
  await capturar(page, '14-veiculos-por-fabricante');

  await page.goto('/veiculos/novo');
  await expect(page.getByRole('option', { name: 'Fiat' })).toBeAttached();
  await page.getByLabel(/^Placa/).fill('XYZ1A23');
  await page.getByLabel(/^Modelo/).fill('Exemplo');
  await page.getByLabel(/^Ano de fabricação/).fill('2024');
  await page.getByLabel(/^Fabricante/).selectOption({ label: 'Fiat' });
  await page.getByLabel(/^Categoria/).selectOption({ label: 'SUV' });
  await capturar(page, '15-veiculos-formulario');
});

test('aluguéis e consultas de aluguéis', async ({ page }) => {
  await page.goto('/alugueis');
  await expect(page.getByRole('table', { name: 'Lista de aluguéis' })).toBeVisible();
  await capturar(page, '16-alugueis-lista');

  // Consulta de demonstração 2: aluguéis por período (INNER JOIN)
  await page.goto(`/alugueis?consulta=periodo&inicio=${dia(-60)}&fim=${dia(0)}`);
  await expect(page.getByText(/\/api\/Alugueis\/filtro\/periodo\?inicio=/)).toBeVisible();
  await expect(page.getByRole('table', { name: 'Lista de aluguéis' })).toBeVisible();
  await capturar(page, '17-alugueis-por-periodo');

  await page.goto('/alugueis');
  const busca = page.getByRole('search', { name: 'Filtrar aluguéis' });
  await busca.getByLabel('Situação').selectOption({ label: 'Atrasado' });
  await busca.getByRole('button', { name: 'Filtrar' }).click();
  await expect(page.getByText('situacao=Atrasado')).toBeVisible();
  await capturar(page, '18-alugueis-filtro-atrasados');

  await page.goto('/clientes');
  await page.getByRole('link', { name: 'Ver histórico de aluguéis de Rafael Tavares' }).click();
  await expect(page.getByText(/\/api\/Alugueis\/filtro\/cliente\/\d+/)).toBeVisible();
  await expect(page.getByRole('table', { name: 'Lista de aluguéis' })).toBeVisible();
  await capturar(page, '19-alugueis-historico-cliente');

  await page.goto('/alugueis/novo');
  await expect(page.getByRole('option', { name: /ABC1D23/ })).toBeAttached();
  await page.getByLabel(/^Cliente/).selectOption({ label: 'Gustavo Pimentel' });
  await page.getByLabel(/^Veículo/).selectOption({ label: 'ABC1D23 · Fiat Mobi' });
  await page.getByLabel(/^Valor da diária/).fill('119.90');
  await capturar(page, '20-alugueis-formulario');
});

test('devolução com valor total calculado pela API (dados temporários)', async ({ page, playwright, baseURL }) => {
  const api: APIRequestContext = await playwright.request.newContext({ baseURL });
  const criar = async (rota: string, corpo: unknown) => (await (await api.post(rota, { data: corpo })).json()) as { id: number };
  const sufixo = String(Date.now()).slice(-5);
  const ids: { aluguel?: number; veiculo?: number; cliente?: number; categoria?: number; fabricante?: number } = {};

  try {
    ids.fabricante = (await criar('/api/Fabricantes', { nome: `TESTE CAPTURA Marca ${sufixo}` })).id;
    ids.categoria = (await criar('/api/Categorias', { nome: `TESTE CAPTURA Categoria ${sufixo}` })).id;
    ids.cliente = (await criar('/api/Clientes', { nome: `TESTE CAPTURA Cliente ${sufixo}`, cpf: `97${sufixo}0000`.slice(0, 11), email: `captura${sufixo}@exemplo.test` })).id;
    ids.veiculo = (await criar('/api/Veiculos', { placa: `CAP${sufixo[0]}X${sufixo.slice(1, 3)}`, modelo: `TESTE CAPTURA ${sufixo}`, anoFabricacao: 2024, quilometragem: 5000, fabricanteId: ids.fabricante, categoriaId: ids.categoria })).id;
    const inicio = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T09:00:00`;
    ids.aluguel = (await criar('/api/Alugueis', { clienteId: ids.cliente, veiculoId: ids.veiculo, dataInicio: iso(inicio), dataFimPrevista: iso(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), dataDevolucao: null, quilometragemInicial: 5000, quilometragemFinal: null, valorDiaria: 150 })).id;

    await page.goto('/alugueis');
    const busca = page.getByRole('search', { name: 'Filtrar aluguéis' });
    await busca.getByLabel('Cliente').selectOption({ label: `TESTE CAPTURA Cliente ${sufixo}` });
    await busca.getByRole('button', { name: 'Filtrar' }).click();
    await page.getByRole('button', { name: `Registrar devolução do aluguel ${ids.aluguel}` }).click();
    const dialogo = page.getByRole('dialog', { name: 'Registrar devolução' });
    await expect(dialogo.getByText(/Estimativa:/)).toBeVisible();
    await dialogo.getByLabel(/^Quilometragem final/).fill('5420');
    await capturar(page, '21-alugueis-devolucao-janela');

    await dialogo.getByRole('button', { name: 'Registrar devolução' }).click();
    await expect(page.getByText(/Valor total calculado pela API/)).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: `CAP${sufixo[0]}X${sufixo.slice(1, 3)}` })).toContainText('Devolvido');
    await capturar(page, '22-alugueis-devolucao-resultado');
  } finally {
    if (ids.aluguel) await api.delete(`/api/Alugueis/${ids.aluguel}`);
    if (ids.veiculo) await api.delete(`/api/Veiculos/${ids.veiculo}`);
    if (ids.cliente) await api.delete(`/api/Clientes/${ids.cliente}`);
    if (ids.categoria) await api.delete(`/api/Categorias/${ids.categoria}`);
    if (ids.fabricante) await api.delete(`/api/Fabricantes/${ids.fabricante}`);
    await api.dispose();
  }
});

test('erro de comunicação e versão móvel', async ({ page }) => {
  await page.route('**/api/**', (rota) => rota.abort('connectionrefused'));
  await page.goto('/veiculos');
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar à API');
  await capturar(page, '23-estado-api-indisponivel');
  await page.unroute('**/api/**');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/veiculos');
  await expect(page.getByText('ABC1D23', { exact: true })).toBeVisible();
  await capturar(page, '24-mobile-veiculos');

  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  await capturar(page, '25-mobile-menu');
});
