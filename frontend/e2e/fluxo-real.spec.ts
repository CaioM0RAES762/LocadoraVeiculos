import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Fluxo completo com a API e o SQL Server reais: cadastro, edição, filtros, consultas especiais,
 * aluguel, devolução, conflitos de exclusão e limpeza. Todos os dados criados têm o prefixo "TESTE E2E"
 * e são removidos ao final (inclusive se o teste falhar no meio).
 */
const PREFIXO = 'TESTE E2E';
const execucao = String(Date.now()).slice(-6);
const sorteio = (n: number) => String(Math.floor(Math.random() * 10 ** n)).padStart(n, '0');

const dados = {
  fabricante: `${PREFIXO} Marca ${execucao}`,
  fabricanteEditado: `${PREFIXO} Marca ${execucao} editada`,
  categoria: `${PREFIXO} Categoria ${execucao}`,
  cliente: `${PREFIXO} Cliente ${execucao}`,
  cpf: `98${execucao}${sorteio(3)}`,
  email: `e2e${execucao}@exemplo.test`,
  placa: `TST${sorteio(1)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${sorteio(2)}`,
  modelo: `${PREFIXO} Modelo`,
};

const rotuloVeiculo = `${dados.placa} · ${dados.fabricanteEditado} ${dados.modelo}`;

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function limparDadosDeTeste(api: APIRequestContext) {
  const lista = async (rota: string) => (await (await api.get(rota)).json()) as { id: number }[];

  for (const cliente of await lista(`/api/Clientes?nome=${encodeURIComponent(PREFIXO)}`)) {
    for (const aluguel of await lista(`/api/Alugueis?clienteId=${cliente.id}`)) await api.delete(`/api/Alugueis/${aluguel.id}`);
    await api.delete(`/api/Clientes/${cliente.id}`);
  }
  for (const veiculo of await lista(`/api/Veiculos?modelo=${encodeURIComponent(PREFIXO)}`)) await api.delete(`/api/Veiculos/${veiculo.id}`);
  for (const fabricante of await lista(`/api/Fabricantes?nome=${encodeURIComponent(PREFIXO)}`)) await api.delete(`/api/Fabricantes/${fabricante.id}`);
  for (const categoria of await lista(`/api/Categorias?nome=${encodeURIComponent(PREFIXO)}`)) await api.delete(`/api/Categorias/${categoria.id}`);
}

async function filtrar(page: Page, rotuloBusca: string, campos: Record<string, string>) {
  const busca = page.getByRole('search', { name: rotuloBusca });
  for (const [rotulo, valor] of Object.entries(campos)) {
    const campo = busca.getByLabel(rotulo);
    if ((await campo.evaluate((el) => el.tagName)) === 'SELECT') await campo.selectOption({ label: valor });
    else await campo.fill(valor);
  }
  await busca.getByRole('button', { name: /^(Filtrar|Consultar)$/ }).click();
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL });
  const resposta = await api.get('/api/Fabricantes').catch(() => null);
  if (!resposta?.ok()) {
    throw new Error('A API não respondeu em /api (via proxy do Vite). Inicie o backend com "dotnet run" e confirme o SQL Server antes dos testes E2E.');
  }
  await limparDadosDeTeste(api); // sobras de execuções interrompidas
  await api.dispose();
});

test.afterAll(async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL });
  await limparDadosDeTeste(api);
  await api.dispose();
});

test('fabricante: cadastra, filtra e edita', async ({ page }) => {
  await page.goto('/fabricantes');
  await page.getByRole('link', { name: 'Novo fabricante' }).first().click();

  // Validação do formulário antes de qualquer chamada
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('alert')).toContainText('O nome do fabricante é obrigatório.');

  await page.getByLabel(/^Nome/).fill(dados.fabricante);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText(`Fabricante “${dados.fabricante}” cadastrado com sucesso.`)).toBeVisible();

  await filtrar(page, 'Filtrar fabricantes', { Nome: dados.fabricante });
  await expect(page).toHaveURL(/nome=/);
  await expect(page.getByRole('cell', { name: dados.fabricante, exact: true })).toBeVisible();

  await page.getByRole('link', { name: `Editar fabricante ${dados.fabricante}` }).click();
  await page.getByLabel(/^Nome/).fill(dados.fabricanteEditado);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText(`Fabricante “${dados.fabricanteEditado}” atualizado com sucesso.`)).toBeVisible();
});

test('categoria e cliente: cadastro com validações da API e consulta de clientes sem aluguéis', async ({ page }) => {
  await page.goto('/categorias/nova');
  await page.getByLabel(/^Nome/).fill(dados.categoria);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText(`Categoria “${dados.categoria}” cadastrada com sucesso.`)).toBeVisible();

  await page.goto('/clientes/novo');
  await page.getByLabel(/^Nome completo/).fill(dados.cliente);
  await page.getByLabel(/^CPF/).fill(dados.cpf);
  await expect(page.getByLabel(/^CPF/)).toHaveValue(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  await page.getByLabel(/^E-mail/).fill(dados.email);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText(`Cliente “${dados.cliente}” cadastrado com sucesso.`)).toBeVisible();

  // CPF duplicado: a API devolve 409 e a mensagem aparece no formulário
  await page.goto('/clientes/novo');
  await page.getByLabel(/^Nome completo/).fill(`${dados.cliente} duplicado`);
  await page.getByLabel(/^CPF/).fill(dados.cpf);
  await page.getByLabel(/^E-mail/).fill(`outro${dados.email}`);
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('alert')).toContainText('Já existe um cliente cadastrado com este CPF.');

  // Consulta LEFT JOIN: o cliente recém-cadastrado ainda não alugou nada
  await page.goto('/clientes');
  await page.getByRole('button', { name: 'Sem aluguéis' }).click();
  await expect(page.getByText('/api/Clientes/filtro/sem-alugueis')).toBeVisible();
  await expect(page.getByRole('cell', { name: dados.cliente, exact: true })).toBeVisible();
});

test('veículo: cadastro com selects da API e consulta de disponíveis', async ({ page }) => {
  await page.goto('/veiculos/novo');
  await page.getByLabel(/^Placa/).fill(dados.placa.toLowerCase());
  await page.getByLabel(/^Modelo/).fill(dados.modelo);
  await page.getByLabel(/^Ano de fabricação/).fill('2024');
  await page.getByLabel(/^Quilometragem/).fill('15000');
  await page.getByLabel(/^Fabricante/).selectOption({ label: dados.fabricanteEditado });
  await page.getByLabel(/^Categoria/).selectOption({ label: dados.categoria });
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText(`Veículo ${dados.placa} cadastrado com sucesso.`)).toBeVisible();

  await page.getByRole('button', { name: 'Disponíveis' }).click();
  await expect(page.getByText('/api/Veiculos/filtro/disponiveis')).toBeVisible();
  await expect(page.getByRole('cell', { name: dados.placa, exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Por fabricante' }).click();
  await filtrar(page, 'Consultar por fabricante', { 'Nome do fabricante': dados.fabricanteEditado });
  await expect(page.getByText(/\/api\/Veiculos\/filtro\/fabricante\?nome=/)).toBeVisible();
  await expect(page.getByRole('cell', { name: dados.placa, exact: true })).toBeVisible();
});

test('aluguel: registra, consulta por período e por cliente e devolve com total da API', async ({ page }) => {
  await page.goto('/alugueis/novo');
  await page.getByLabel(/^Cliente/).selectOption({ label: dados.cliente });
  await page.getByLabel(/^Veículo/).selectOption({ label: rotuloVeiculo });
  await expect(page.getByLabel(/^Quilometragem inicial/)).toHaveValue('15000');
  await page.getByLabel(/^Valor da diária/).fill('100');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText(/Aluguel #\d+ registrado com sucesso\./)).toBeVisible();

  // O veículo alugado sai da consulta de disponíveis e o cliente sai da consulta "sem aluguéis"
  await page.goto('/veiculos?consulta=disponiveis');
  await expect(page.getByText('/api/Veiculos/filtro/disponiveis')).toBeVisible();
  await expect(page.getByRole('cell', { name: dados.placa, exact: true })).toHaveCount(0);
  await page.goto('/clientes?consulta=sem-alugueis');
  await expect(page.getByText('/api/Clientes/filtro/sem-alugueis')).toBeVisible();
  await expect(page.getByRole('cell', { name: dados.cliente, exact: true })).toHaveCount(0);

  // Filtros combinados na listagem
  await page.goto('/alugueis');
  await filtrar(page, 'Filtrar aluguéis', { Cliente: dados.cliente, Situação: 'Em andamento' });
  const linha = page.getByRole('row').filter({ hasText: dados.placa });
  await expect(linha).toContainText('Em andamento');

  // Consulta por período (INNER JOIN) e histórico por cliente
  await page.goto('/alugueis?consulta=periodo');
  await filtrar(page, 'Consultar aluguéis por período', { 'Data inicial': hoje(), 'Data final': hoje() });
  await expect(page.getByText(/\/api\/Alugueis\/filtro\/periodo\?inicio=/)).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: dados.placa })).toBeVisible();

  await page.goto('/alugueis?consulta=cliente');
  await filtrar(page, 'Consultar histórico por cliente', { Cliente: dados.cliente });
  await expect(page.getByText(/\/api\/Alugueis\/filtro\/cliente\/\d+/)).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: dados.placa })).toBeVisible();

  // Devolução: a API calcula o valor total (1 diária de R$ 100,00)
  await page.goto('/alugueis');
  await filtrar(page, 'Filtrar aluguéis', { Cliente: dados.cliente });
  await page.getByRole('row').filter({ hasText: dados.placa }).getByRole('button', { name: /Registrar devolução do aluguel/ }).click();
  const dialogo = page.getByRole('dialog', { name: 'Registrar devolução' });
  await expect(dialogo.getByText(/Estimativa:/)).toBeVisible();
  await dialogo.getByLabel(/^Quilometragem final/).fill('15200');
  await dialogo.getByRole('button', { name: 'Registrar devolução' }).click();
  await expect(page.getByText(/Valor total calculado pela API: R\$\s100,00/)).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: dados.placa })).toContainText('Devolvido');

  // O veículo voltou a ficar disponível
  await page.goto('/veiculos?consulta=disponiveis');
  await expect(page.getByRole('cell', { name: dados.placa, exact: true })).toBeVisible();
});

test('conflitos 409 ao excluir registros vinculados e exclusão permitida na ordem correta', async ({ page }) => {
  // Fabricante com veículo vinculado
  await page.goto('/fabricantes');
  await filtrar(page, 'Filtrar fabricantes', { Nome: dados.fabricanteEditado });
  await page.getByRole('button', { name: `Excluir fabricante ${dados.fabricanteEditado}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByRole('alert')).toContainText('Não é possível excluir o fabricante porque existem veículos vinculados a ele.');

  // Cliente com aluguel vinculado
  await page.goto('/clientes');
  await filtrar(page, 'Filtrar clientes', { Nome: dados.cliente });
  await page.getByRole('button', { name: `Excluir cliente ${dados.cliente}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByRole('alert')).toContainText('existem aluguéis vinculados a ele');

  // Cancelar a confirmação não exclui
  await page.getByRole('button', { name: `Excluir cliente ${dados.cliente}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('cell', { name: dados.cliente, exact: true })).toBeVisible();

  // Exclusões permitidas, de dentro para fora
  await page.goto('/alugueis');
  await filtrar(page, 'Filtrar aluguéis', { Cliente: dados.cliente });
  await page.getByRole('row').filter({ hasText: dados.placa }).getByRole('button', { name: /Excluir aluguel/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByText(/Aluguel #\d+ .* excluído com sucesso\./)).toBeVisible();

  await page.goto('/veiculos');
  await filtrar(page, 'Filtrar veículos', { Placa: dados.placa });
  await page.getByRole('button', { name: `Excluir veículo ${dados.placa}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByText(`Veículo ${dados.placa} (${dados.fabricanteEditado} ${dados.modelo}) excluído com sucesso.`)).toBeVisible();

  await page.goto('/clientes');
  await filtrar(page, 'Filtrar clientes', { Nome: dados.cliente });
  await page.getByRole('button', { name: `Excluir cliente ${dados.cliente}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByText(`Cliente “${dados.cliente}” excluído com sucesso.`)).toBeVisible();

  await page.goto('/categorias');
  await filtrar(page, 'Filtrar categorias', { Nome: dados.categoria });
  await page.getByRole('button', { name: `Excluir categoria ${dados.categoria}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByText(`Categoria “${dados.categoria}” excluída com sucesso.`)).toBeVisible();

  await page.goto('/fabricantes');
  await filtrar(page, 'Filtrar fabricantes', { Nome: dados.fabricanteEditado });
  await page.getByRole('button', { name: `Excluir fabricante ${dados.fabricanteEditado}` }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByText(`Fabricante “${dados.fabricanteEditado}” excluído com sucesso.`)).toBeVisible();
});

test('rotas internas funcionam ao recarregar e registros inexistentes mostram erro', async ({ page }) => {
  await page.goto('/veiculos?consulta=disponiveis');
  await expect(page.getByRole('heading', { level: 1, name: 'Veículos' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Disponíveis' })).toHaveAttribute('aria-current', 'true');
  await expect(page.getByText('/api/Veiculos/filtro/disponiveis')).toBeVisible();

  await page.goto('/alugueis/novo');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Novo aluguel' })).toBeVisible();

  await page.goto('/fabricantes/999999/editar');
  await expect(page.getByRole('alert')).toContainText('Fabricante não encontrado.');

  await page.goto('/rota/que/nao/existe');
  await expect(page.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeVisible();
});

test('API indisponível mostra mensagem compreensível e permite tentar novamente', async ({ page }) => {
  await page.route('**/api/**', (rota) => rota.abort('connectionrefused'));
  await page.goto('/clientes');
  await expect(page.getByRole('alert')).toContainText('Não foi possível conectar à API');

  await page.unroute('**/api/**');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('table', { name: 'Lista de clientes' })).toBeVisible();
});

test('acessibilidade: sem violações graves nas telas principais (axe-core)', async ({ page }) => {
  for (const rota of ['/', '/fabricantes', '/clientes', '/veiculos', '/alugueis', '/veiculos/novo', '/alugueis/novo']) {
    await page.goto(rota);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const graves = resultado.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(graves.map((v) => `${rota}: ${v.id} (${v.nodes.length})`), `violações em ${rota}`).toEqual([]);
  }
});
