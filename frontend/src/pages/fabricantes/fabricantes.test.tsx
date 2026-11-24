import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { categorias, fabricantes, instalarApiFalsa, json, renderizarApp, semConteudo } from '../../test/utils';

afterEach(() => vi.unstubAllGlobals());

describe('Fabricantes', () => {
  it('lista os fabricantes retornados pela API', async () => {
    const api = instalarApiFalsa({ 'GET /api/Fabricantes': () => json(fabricantes) });
    renderizarApp('/fabricantes');

    expect(await screen.findByText('Fiat')).toBeInTheDocument();
    expect(screen.getByText('Volkswagen')).toBeInTheDocument();
    expect(screen.getByText('2 registros')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Fabricantes' })).toBeInTheDocument();
    expect(api.urls()).toContain('GET /api/Fabricantes');
  });

  it('mostra o estado de carregamento e depois o vazio', async () => {
    instalarApiFalsa({ 'GET /api/Fabricantes': () => json([]) });
    renderizarApp('/fabricantes');

    expect(screen.getByRole('status')).toHaveTextContent('Carregando fabricantes');
    expect(await screen.findByText('Nenhum fabricante cadastrado')).toBeInTheDocument();
  });

  it('filtra por nome e por código enviando os parâmetros à API', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({ 'GET /api/Fabricantes': () => json(fabricantes) });
    renderizarApp('/fabricantes');
    await screen.findByText('Fiat');

    await usuario.type(screen.getByLabelText('Nome'), 'vol');
    await usuario.type(screen.getByLabelText('Código'), '2');
    await usuario.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => expect(api.urls()).toContain('GET /api/Fabricantes?id=2&nome=vol'));
  });

  it('informa quando o filtro não encontra nada e permite limpar', async () => {
    const usuario = userEvent.setup();
    instalarApiFalsa({ 'GET /api/Fabricantes': (c) => json(c.url.includes('nome=zzz') ? [] : fabricantes) });
    renderizarApp('/fabricantes?nome=zzz');

    expect(await screen.findByText('Nenhum fabricante encontrado')).toBeInTheDocument();
    await usuario.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findByText('Fiat')).toBeInTheDocument();
  });

  it('confirma antes de excluir, exclui e atualiza a lista', async () => {
    const usuario = userEvent.setup();
    let existentes = [...fabricantes];
    const api = instalarApiFalsa({
      'GET /api/Fabricantes': () => json(existentes),
      'DELETE /api/Fabricantes/1': () => {
        existentes = existentes.filter((f) => f.id !== 1);
        return semConteudo();
      },
    });
    renderizarApp('/fabricantes');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir fabricante Fiat' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Excluir fabricante?' });
    expect(dialogo).toHaveTextContent('Deseja realmente excluir o fabricante “Fiat”?');
    expect(api.urls()).not.toContain('DELETE /api/Fabricantes/1');

    await usuario.click(within(dialogo).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByText('Fabricante “Fiat” excluído com sucesso.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Fiat')).not.toBeInTheDocument());
    expect(api.urls()).toContain('DELETE /api/Fabricantes/1');
  });

  it('cancelar a confirmação não exclui nada', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({ 'GET /api/Fabricantes': () => json(fabricantes) });
    renderizarApp('/fabricantes');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir fabricante Fiat' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Excluir fabricante?' });
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.urls().some((u) => u.startsWith('DELETE'))).toBe(false);
  });

  it('exibe a mensagem da API ao receber 409 por vínculos', async () => {
    const usuario = userEvent.setup();
    const mensagem = 'Não é possível excluir o fabricante porque existem veículos vinculados a ele.';
    instalarApiFalsa({
      'GET /api/Fabricantes': () => json(fabricantes),
      'DELETE /api/Fabricantes/1': () => json({ mensagem }, 409),
    });
    renderizarApp('/fabricantes');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir fabricante Fiat' }));
    await usuario.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem);
    expect(screen.getByText('Fiat')).toBeInTheDocument();
  });

  it('mostra erro de comunicação e permite tentar novamente', async () => {
    const usuario = userEvent.setup();
    let tentativas = 0;
    instalarApiFalsa({
      'GET /api/Fabricantes': () => {
        tentativas += 1;
        return tentativas === 1 ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(json(fabricantes));
      },
    });
    renderizarApp('/fabricantes');

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API');
    await usuario.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Fiat')).toBeInTheDocument();
  });

  describe('formulário', () => {
    it('valida o nome obrigatório sem chamar a API', async () => {
      const usuario = userEvent.setup();
      const api = instalarApiFalsa({});
      renderizarApp('/fabricantes/novo');

      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect((await screen.findAllByText('O nome do fabricante é obrigatório.')).length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/^Nome/)).toHaveAttribute('aria-invalid', 'true');
      expect(api.chamadas).toHaveLength(0);
    });

    it('cadastra um fabricante, avisa o sucesso e volta para a lista', async () => {
      const usuario = userEvent.setup();
      const api = instalarApiFalsa({
        'POST /api/Fabricantes': () => json({ id: 3, nome: 'Honda' }, 201),
        'GET /api/Fabricantes': () => json([...fabricantes, { id: 3, nome: 'Honda' }]),
      });
      renderizarApp('/fabricantes/novo');

      await usuario.type(screen.getByLabelText(/^Nome/), '  Honda  ');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByText('Fabricante “Honda” cadastrado com sucesso.')).toBeInTheDocument();
      expect(await screen.findByRole('heading', { level: 1, name: 'Fabricantes' })).toBeInTheDocument();
      expect(api.chamadas.find((c) => c.metodo === 'POST')?.corpo).toEqual({ nome: 'Honda' });
    });

    it('carrega o registro na edição e envia PUT com o novo nome', async () => {
      const usuario = userEvent.setup();
      const api = instalarApiFalsa({
        'GET /api/Fabricantes/1': () => json(fabricantes[0]),
        'PUT /api/Fabricantes/1': () => semConteudo(),
        'GET /api/Fabricantes': () => json(fabricantes),
      });
      renderizarApp('/fabricantes/1/editar');

      const campo = await screen.findByLabelText(/^Nome/);
      expect(campo).toHaveValue('Fiat');
      await usuario.clear(campo);
      await usuario.type(campo, 'Fiat Brasil');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByText('Fabricante “Fiat Brasil” atualizado com sucesso.')).toBeInTheDocument();
      expect(api.chamadas.find((c) => c.metodo === 'PUT')?.corpo).toEqual({ nome: 'Fiat Brasil' });
    });

    it('mostra o erro 404 ao editar um registro inexistente', async () => {
      instalarApiFalsa({ 'GET /api/Fabricantes/99': () => json({ mensagem: 'Fabricante não encontrado.' }, 404) });
      renderizarApp('/fabricantes/99/editar');

      expect(await screen.findByRole('alert')).toHaveTextContent('Fabricante não encontrado.');
      expect(screen.getByRole('link', { name: 'Voltar para fabricantes' })).toHaveAttribute('href', '/fabricantes');
    });

    it('rejeita um código inválido na URL', async () => {
      instalarApiFalsa({});
      renderizarApp('/fabricantes/abc/editar');
      expect(await screen.findByRole('alert')).toHaveTextContent('código informado na URL é inválido');
    });

    it('exibe o conflito 409 de nome duplicado no formulário', async () => {
      const usuario = userEvent.setup();
      instalarApiFalsa({ 'POST /api/Fabricantes': () => json({ mensagem: 'Já existe um fabricante com este nome.' }, 409) });
      renderizarApp('/fabricantes/novo');

      await usuario.type(screen.getByLabelText(/^Nome/), 'Fiat');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um fabricante com este nome.');
    });

    it('associa erros de validação da API ao campo correspondente', async () => {
      const usuario = userEvent.setup();
      instalarApiFalsa({
        'POST /api/Fabricantes': () => json({ title: 'erro', status: 400, errors: { Nome: ['O nome do fabricante deve ter no máximo 100 caracteres.'] } }, 400),
      });
      renderizarApp('/fabricantes/novo');

      await usuario.type(screen.getByLabelText(/^Nome/), 'Algo');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect((await screen.findAllByText('O nome do fabricante deve ter no máximo 100 caracteres.')).length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/^Nome/)).toHaveAttribute('aria-invalid', 'true');
    });
  });
});

describe('Categorias', () => {
  it('usa o gênero feminino nas mensagens e rotas próprias', async () => {
    const usuario = userEvent.setup();
    instalarApiFalsa({
      'GET /api/Categorias': () => json(categorias),
      'DELETE /api/Categorias/3': () => semConteudo(),
    });
    renderizarApp('/categorias');

    expect(await screen.findByRole('link', { name: 'Nova categoria' })).toHaveAttribute('href', '/categorias/nova');
    await usuario.click(screen.getByRole('button', { name: 'Excluir categoria SUV' }));
    await usuario.click(within(await screen.findByRole('dialog', { name: 'Excluir categoria?' })).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByText('Categoria “SUV” excluída com sucesso.')).toBeInTheDocument();
  });

  it('cadastra uma categoria validando o limite de 80 caracteres', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      'POST /api/Categorias': () => json({ id: 9, nome: 'Esportivo' }, 201),
      'GET /api/Categorias': () => json(categorias),
    });
    renderizarApp('/categorias/nova');

    const campo = screen.getByLabelText(/^Nome/);
    expect(campo).toHaveAttribute('maxLength', '80');
    await usuario.type(campo, 'Esportivo');
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Categoria “Esportivo” cadastrada com sucesso.')).toBeInTheDocument();
    expect(api.chamadas.find((c) => c.metodo === 'POST')?.corpo).toEqual({ nome: 'Esportivo' });
  });
});
