import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { categorias, fabricantes, instalarApiFalsa, json, renderizarApp, semConteudo, veiculos } from '../../test/utils';

afterEach(() => vi.unstubAllGlobals());

const apoio = {
  'GET /api/Fabricantes': () => json(fabricantes),
  'GET /api/Categorias': () => json(categorias),
};

describe('Veículos', () => {
  it('lista os veículos com a situação de disponibilidade', async () => {
    instalarApiFalsa({ ...apoio, 'GET /api/Veiculos': () => json(veiculos) });
    renderizarApp('/veiculos');

    const tabela = within(await screen.findByRole('table', { name: 'Lista de veículos' }));
    expect(tabela.getByText('ABC1D23')).toBeInTheDocument();
    expect(tabela.getByText('Fiat Mobi')).toBeInTheDocument();
    expect(tabela.getByText('Disponível')).toBeInTheDocument();
    expect(tabela.getByText('Em locação')).toBeInTheDocument();
    // Só veículos disponíveis oferecem o atalho para alugar.
    expect(screen.getByRole('link', { name: 'Alugar veículo ABC1D23' })).toHaveAttribute('href', '/alugueis/novo?veiculoId=1');
    expect(screen.queryByRole('link', { name: 'Alugar veículo FGH2E34' })).not.toBeInTheDocument();
  });

  it('combina filtros de placa, fabricante, categoria e disponibilidade em uma única consulta', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({ ...apoio, 'GET /api/Veiculos': () => json(veiculos) });
    renderizarApp('/veiculos');
    await screen.findByText('ABC1D23');
    await screen.findByRole('option', { name: 'Fiat' });

    await usuario.type(screen.getByLabelText('Placa'), 'abc');
    expect(screen.getByLabelText('Placa')).toHaveValue('ABC');
    await usuario.selectOptions(screen.getByLabelText('Fabricante'), 'Fiat');
    await usuario.selectOptions(screen.getByLabelText('Categoria'), 'Econômico');
    await usuario.selectOptions(screen.getByLabelText('Disponibilidade'), 'Disponíveis');
    await usuario.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => expect(api.urls()).toContain('GET /api/Veiculos?placa=ABC&fabricanteId=1&categoriaId=1&disponivel=true'));
  });

  it('consulta os veículos disponíveis pela rota própria (LEFT JOIN)', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      ...apoio,
      'GET /api/Veiculos': () => json(veiculos),
      'GET /api/Veiculos/filtro/disponiveis': () => json([veiculos[0]]),
    });
    renderizarApp('/veiculos');
    await screen.findByText('ABC1D23');

    await usuario.click(screen.getByRole('button', { name: 'Disponíveis' }));

    expect(await screen.findByText('/api/Veiculos/filtro/disponiveis')).toBeInTheDocument();
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    expect(screen.queryByText('FGH2E34')).not.toBeInTheDocument();
    expect(api.urls()).toContain('GET /api/Veiculos/filtro/disponiveis');
  });

  it('exige o nome do fabricante antes de consultar por fabricante (INNER JOIN)', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({ ...apoio, 'GET /api/Veiculos/filtro/fabricante': () => json(veiculos) });
    renderizarApp('/veiculos?consulta=fabricante');

    expect(await screen.findByText('Informe o nome do fabricante')).toBeInTheDocument();
    expect(api.urls().some((u) => u.includes('filtro/fabricante'))).toBe(false);

    await usuario.type(screen.getByLabelText(/^Nome do fabricante/), 'Fiat');
    await usuario.click(screen.getByRole('button', { name: 'Consultar' }));

    expect(await screen.findByText('/api/Veiculos/filtro/fabricante?nome=Fiat')).toBeInTheDocument();
    expect(api.urls()).toContain('GET /api/Veiculos/filtro/fabricante?nome=Fiat');
  });

  it('mostra o conflito ao excluir um veículo com aluguéis', async () => {
    const usuario = userEvent.setup();
    instalarApiFalsa({
      ...apoio,
      'GET /api/Veiculos': () => json(veiculos),
      'DELETE /api/Veiculos/2': () => json({ mensagem: 'Não é possível excluir o veículo porque existem aluguéis vinculados a ele.' }, 409),
    });
    renderizarApp('/veiculos');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir veículo FGH2E34' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Excluir veículo?' });
    expect(dialogo).toHaveTextContent('FGH2E34 (Fiat Argo)');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('existem aluguéis vinculados a ele');
  });

  describe('formulário', () => {
    it('carrega fabricantes e categorias da API nos campos de seleção', async () => {
      const api = instalarApiFalsa(apoio);
      renderizarApp('/veiculos/novo');

      expect(await screen.findByRole('option', { name: 'Volkswagen' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'SUV' })).toBeInTheDocument();
      expect(api.urls()).toEqual(expect.arrayContaining(['GET /api/Fabricantes', 'GET /api/Categorias']));
    });

    it('valida placa, ano e seleções antes de chamar a API', async () => {
      const usuario = userEvent.setup();
      const api = instalarApiFalsa(apoio);
      renderizarApp('/veiculos/novo');

      await screen.findByRole('option', { name: 'Fiat' });
      await usuario.type(screen.getByLabelText(/^Placa/), '12ABC34');
      await usuario.type(screen.getByLabelText(/^Modelo/), 'Mobi');
      await usuario.type(screen.getByLabelText(/^Ano de fabricação/), '1800');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      const resumo = await screen.findByRole('alert');
      expect(resumo).toHaveTextContent('A placa deve estar no formato ABC1234, ABC-1234 ou ABC1D23.');
      expect(resumo).toHaveTextContent('O ano de fabricação deve estar entre 1900 e');
      expect(resumo).toHaveTextContent('Selecione um fabricante.');
      expect(resumo).toHaveTextContent('Selecione uma categoria.');
      expect(api.chamadas.some((c) => c.metodo === 'POST')).toBe(false);
    });

    it('cadastra um veículo enviando os identificadores selecionados', async () => {
      const usuario = userEvent.setup();
      const api = instalarApiFalsa({
        ...apoio,
        'POST /api/Veiculos': () => json({ ...veiculos[0], id: 20, placa: 'XYZ9K88' }, 201),
        'GET /api/Veiculos': () => json(veiculos),
      });
      renderizarApp('/veiculos/novo');

      await screen.findByRole('option', { name: 'Fiat' });
      await usuario.type(screen.getByLabelText(/^Placa/), 'xyz9k88');
      await usuario.type(screen.getByLabelText(/^Modelo/), 'Mobi');
      await usuario.type(screen.getByLabelText(/^Ano de fabricação/), '2023');
      await usuario.selectOptions(screen.getByLabelText(/^Fabricante/), 'Fiat');
      await usuario.selectOptions(screen.getByLabelText(/^Categoria/), 'Econômico');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByText('Veículo XYZ9K88 cadastrado com sucesso.')).toBeInTheDocument();
      expect(api.chamadas.find((c) => c.metodo === 'POST')?.corpo).toEqual({
        placa: 'XYZ9K88',
        modelo: 'Mobi',
        anoFabricacao: 2023,
        quilometragem: 0,
        fabricanteId: 1,
        categoriaId: 1,
      });
    });

    it('preenche o formulário na edição e envia PUT', async () => {
      const usuario = userEvent.setup();
      const api = instalarApiFalsa({
        ...apoio,
        'GET /api/Veiculos/1': () => json(veiculos[0]),
        'PUT /api/Veiculos/1': () => semConteudo(),
        'GET /api/Veiculos': () => json(veiculos),
      });
      renderizarApp('/veiculos/1/editar');

      const km = await screen.findByLabelText(/^Quilometragem/);
      expect(screen.getByLabelText(/^Placa/)).toHaveValue('ABC1D23');
      expect(screen.getByLabelText(/^Fabricante/)).toHaveValue('1');
      await usuario.clear(km);
      await usuario.type(km, '19000');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByText('Veículo ABC1D23 atualizado com sucesso.')).toBeInTheDocument();
      expect((api.chamadas.find((c) => c.metodo === 'PUT')?.corpo as { quilometragem: number }).quilometragem).toBe(19000);
    });

    it('orienta a cadastrar fabricante e categoria quando não existem', async () => {
      instalarApiFalsa({ 'GET /api/Fabricantes': () => json([]), 'GET /api/Categorias': () => json([]) });
      renderizarApp('/veiculos/novo');

      expect(await screen.findByRole('link', { name: 'Cadastre um fabricante' })).toHaveAttribute('href', '/fabricantes/novo');
      expect(screen.getByRole('link', { name: 'Cadastre uma categoria' })).toHaveAttribute('href', '/categorias/nova');
    });
  });
});
