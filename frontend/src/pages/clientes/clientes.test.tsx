import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientes, instalarApiFalsa, json, renderizarApp } from '../../test/utils';

afterEach(() => vi.unstubAllGlobals());

describe('Clientes', () => {
  it('lista os clientes com CPF formatado e atalho para o histórico', async () => {
    instalarApiFalsa({ 'GET /api/Clientes': () => json(clientes) });
    renderizarApp('/clientes');

    expect(await screen.findByText('Mariana Albuquerque')).toBeInTheDocument();
    expect(screen.getByText('102.030.405-70')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver histórico de aluguéis de Mariana Albuquerque' })).toHaveAttribute(
      'href',
      '/alugueis?consulta=cliente&clienteId=1',
    );
  });

  it('filtra por nome, CPF e e-mail', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({ 'GET /api/Clientes': () => json(clientes) });
    renderizarApp('/clientes');
    await screen.findByText('Rafael Tavares');

    await usuario.type(screen.getByLabelText('Nome'), 'ana');
    await usuario.type(screen.getByLabelText('CPF'), '10203');
    expect(screen.getByLabelText('CPF')).toHaveValue('102.03');
    await usuario.type(screen.getByLabelText('E-mail'), 'exemplo');
    await usuario.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => expect(api.urls()).toContain('GET /api/Clientes?nome=ana&cpf=102.03&email=exemplo'));
  });

  it('consulta clientes sem aluguéis pela rota própria (LEFT JOIN)', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      'GET /api/Clientes': () => json(clientes),
      'GET /api/Clientes/filtro/sem-alugueis': () => json([clientes[1]]),
    });
    renderizarApp('/clientes');
    await screen.findByText('Mariana Albuquerque');

    await usuario.click(screen.getByRole('button', { name: 'Sem aluguéis' }));

    expect(await screen.findByText('/api/Clientes/filtro/sem-alugueis')).toBeInTheDocument();
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    expect(screen.queryByText('Mariana Albuquerque')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Novo aluguel para Rafael Tavares' })).toHaveAttribute('href', '/alugueis/novo?clienteId=2');
    expect(api.urls()).toContain('GET /api/Clientes/filtro/sem-alugueis');
  });

  it('abre direto na consulta indicada pela URL (recarregar a página)', async () => {
    instalarApiFalsa({ 'GET /api/Clientes/filtro/sem-alugueis': () => json([]) });
    renderizarApp('/clientes?consulta=sem-alugueis');
    expect(await screen.findByText('Todos os clientes já alugaram')).toBeInTheDocument();
  });

  it('exclui com confirmação e mostra o conflito de vínculos', async () => {
    const usuario = userEvent.setup();
    instalarApiFalsa({
      'GET /api/Clientes': () => json(clientes),
      'DELETE /api/Clientes/1': () => json({ mensagem: 'Não é possível excluir o cliente porque existem aluguéis vinculados a ele.' }, 409),
    });
    renderizarApp('/clientes');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir cliente Mariana Albuquerque' }));
    await usuario.click((await screen.findAllByRole('button', { name: 'Excluir' }))[0]);

    expect(await screen.findByRole('alert')).toHaveTextContent('existem aluguéis vinculados a ele');
  });

  describe('formulário', () => {
    it('aplica a máscara de CPF e envia apenas os dígitos', async () => {
      const usuario = userEvent.setup();
      const api = instalarApiFalsa({
        'POST /api/Clientes': () => json({ ...clientes[0], id: 3 }, 201),
        'GET /api/Clientes': () => json(clientes),
      });
      renderizarApp('/clientes/novo');

      await usuario.type(screen.getByLabelText(/^Nome completo/), 'Ana Teste');
      await usuario.type(screen.getByLabelText(/^CPF/), '10203040570');
      expect(screen.getByLabelText(/^CPF/)).toHaveValue('102.030.405-70');
      await usuario.type(screen.getByLabelText(/^E-mail/), 'ana@exemplo.test');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByText('Cliente “Ana Teste” cadastrado com sucesso.')).toBeInTheDocument();
      expect(api.chamadas.find((c) => c.metodo === 'POST')?.corpo).toEqual({ nome: 'Ana Teste', cpf: '10203040570', email: 'ana@exemplo.test' });
    });

    it('valida CPF incompleto e e-mail inválido antes de chamar a API', async () => {
      const usuario = userEvent.setup();
      const api = instalarApiFalsa({});
      renderizarApp('/clientes/novo');

      await usuario.type(screen.getByLabelText(/^Nome completo/), 'Ana');
      await usuario.type(screen.getByLabelText(/^CPF/), '123');
      await usuario.type(screen.getByLabelText(/^E-mail/), 'ana');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      const resumo = await screen.findByRole('alert');
      expect(resumo).toHaveTextContent('O CPF deve conter exatamente 11 dígitos numéricos.');
      expect(resumo).toHaveTextContent('O e-mail informado não é válido.');
      expect(api.chamadas).toHaveLength(0);
    });

    it('carrega o cliente na edição com CPF mascarado', async () => {
      instalarApiFalsa({ 'GET /api/Clientes/1': () => json(clientes[0]) });
      renderizarApp('/clientes/1/editar');

      expect(await screen.findByLabelText(/^CPF/)).toHaveValue('102.030.405-70');
      expect(screen.getByLabelText(/^Nome completo/)).toHaveValue('Mariana Albuquerque');
    });

    it('mostra o conflito de CPF duplicado devolvido pela API', async () => {
      const usuario = userEvent.setup();
      instalarApiFalsa({ 'POST /api/Clientes': () => json({ mensagem: 'Já existe um cliente cadastrado com este CPF.' }, 409) });
      renderizarApp('/clientes/novo');

      await usuario.type(screen.getByLabelText(/^Nome completo/), 'Ana');
      fireEvent.change(screen.getByLabelText(/^CPF/), { target: { value: '10203040570' } });
      await usuario.type(screen.getByLabelText(/^E-mail/), 'ana@exemplo.test');
      await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um cliente cadastrado com este CPF.');
    });
  });
});
