import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aluguelDevolvido, aluguelEmAberto, clientes, instalarApiFalsa, json, renderizarApp, semConteudo, veiculos } from '../../test/utils';

afterEach(() => vi.unstubAllGlobals());

const apoio = {
  'GET /api/Clientes': () => json(clientes),
  'GET /api/Veiculos': () => json(veiculos),
};

describe('Aluguéis — listagem e consultas', () => {
  it('lista os aluguéis com situação e valor total vindos da API', async () => {
    instalarApiFalsa({ ...apoio, 'GET /api/Alugueis': () => json([aluguelEmAberto, aluguelDevolvido]) });
    renderizarApp('/alugueis');

    const tabela = within(await screen.findByRole('table', { name: 'Lista de aluguéis' }));
    expect(tabela.getByText('Atrasado')).toBeInTheDocument();
    expect(tabela.getByText('Devolvido')).toBeInTheDocument();
    expect(tabela.getByText(/259,80/)).toBeInTheDocument();
    // "Devolver" só existe para aluguéis em aberto.
    expect(screen.getByRole('button', { name: 'Registrar devolução do aluguel 16' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar devolução do aluguel 11' })).not.toBeInTheDocument();
  });

  it('aplica filtros combinados na listagem (cliente, situação e datas)', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({ ...apoio, 'GET /api/Alugueis': () => json([aluguelEmAberto]) });
    renderizarApp('/alugueis');
    await screen.findByText('Atrasado');
    await screen.findByRole('option', { name: 'Rafael Tavares' });

    await usuario.selectOptions(screen.getByLabelText('Cliente'), 'Rafael Tavares');
    await usuario.selectOptions(screen.getByLabelText('Situação'), 'Atrasado');
    fireEvent.change(screen.getByLabelText('Início a partir de'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Início até'), { target: { value: '2026-11-30' } });
    await usuario.click(screen.getByRole('button', { name: 'Filtrar' }));

    await waitFor(() => expect(api.urls()).toContain('GET /api/Alugueis?clienteId=2&situacao=Atrasado&inicio=2026-11-01&fim=2026-11-30'));
  });

  it('consulta aluguéis por período pela rota própria (INNER JOIN)', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      ...apoio,
      'GET /api/Alugueis/filtro/periodo': () => json([aluguelDevolvido]),
    });
    renderizarApp('/alugueis?consulta=periodo');

    expect(await screen.findByText('Informe o período')).toBeInTheDocument();
    expect(api.urls().some((u) => u.includes('filtro/periodo'))).toBe(false);

    fireEvent.change(screen.getByLabelText(/^Data inicial/), { target: { value: '2026-11-15' } });
    fireEvent.change(screen.getByLabelText(/^Data final/), { target: { value: '2026-11-30' } });
    await usuario.click(screen.getByRole('button', { name: 'Consultar' }));

    expect(await screen.findByText('/api/Alugueis/filtro/periodo?inicio=2026-11-15&fim=2026-11-30')).toBeInTheDocument();
    expect(screen.getByText('1 resultado')).toBeInTheDocument();
    expect(screen.getByText('Período: 15/11/2026 a 30/11/2026')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Devolvido')).toBeInTheDocument();
  });

  it('mostra a mensagem da API para período inválido (400)', async () => {
    instalarApiFalsa({
      ...apoio,
      'GET /api/Alugueis/filtro/periodo': () => json({ mensagem: 'A data final do período não pode ser anterior à data inicial.' }, 400),
    });
    renderizarApp('/alugueis?consulta=periodo&inicio=2026-12-01&fim=2026-11-01');

    expect(await screen.findByRole('alert')).toHaveTextContent('A data final do período não pode ser anterior à data inicial.');
  });

  it('mostra o histórico de aluguéis de um cliente (INNER JOIN com fabricante)', async () => {
    const api = instalarApiFalsa({
      ...apoio,
      'GET /api/Alugueis/filtro/cliente/2': () =>
        json([
          {
            id: 16,
            veiculoId: 2,
            placa: 'FGH2E34',
            modelo: 'Argo',
            fabricante: 'Fiat',
            dataInicio: '2026-11-18T09:00:00',
            dataFimPrevista: '2026-11-22T09:00:00',
            dataDevolucao: null,
            quilometragemInicial: 32400,
            quilometragemFinal: null,
            valorDiaria: 129.9,
            valorTotal: null,
            situacao: 'Atrasado',
          },
        ]),
    });
    renderizarApp('/alugueis?consulta=cliente&clienteId=2');

    expect(await screen.findByText('FGH2E34 · Fiat Argo')).toBeInTheDocument();
    expect(await screen.findByText('Cliente: Rafael Tavares')).toBeInTheDocument();
    expect(api.urls()).toContain('GET /api/Alugueis/filtro/cliente/2');
    expect(screen.queryByRole('columnheader', { name: 'Cliente' })).not.toBeInTheDocument();
  });

  it('informa quando não há aluguéis para o filtro', async () => {
    instalarApiFalsa({ ...apoio, 'GET /api/Alugueis': () => json([]) });
    renderizarApp('/alugueis?situacao=Atrasado');
    expect(await screen.findByText('Nenhum aluguel encontrado')).toBeInTheDocument();
  });

  it('exclui um aluguel após confirmação', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      ...apoio,
      'GET /api/Alugueis': () => json([aluguelDevolvido]),
      'DELETE /api/Alugueis/11': () => semConteudo(),
    });
    renderizarApp('/alugueis');

    await usuario.click(await screen.findByRole('button', { name: 'Excluir aluguel 11' }));
    await usuario.click(within(await screen.findByRole('dialog', { name: 'Excluir aluguel?' })).getByRole('button', { name: 'Excluir' }));

    expect(await screen.findByText('Aluguel #11 (FGH2E34 · Argo) excluído com sucesso.')).toBeInTheDocument();
    expect(api.urls()).toContain('DELETE /api/Alugueis/11');
  });
});

describe('Aluguéis — devolução', () => {
  it('registra a devolução com PUT completo e exibe o total calculado pela API', async () => {
    const usuario = userEvent.setup();
    let devolvido = false;
    const api = instalarApiFalsa({
      ...apoio,
      'GET /api/Alugueis': () => json([devolvido ? { ...aluguelDevolvido, id: 16 } : aluguelEmAberto]),
      'GET /api/Alugueis/16': () => json(devolvido ? { ...aluguelDevolvido, id: 16, valorTotal: 909.3 } : aluguelEmAberto),
      'PUT /api/Alugueis/16': () => {
        devolvido = true;
        return semConteudo();
      },
    });
    renderizarApp('/alugueis');

    await usuario.click(await screen.findByRole('button', { name: 'Registrar devolução do aluguel 16' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Registrar devolução' });
    const km = await within(dialogo).findByLabelText(/^Quilometragem final/);
    expect(km).toHaveValue(32400);
    expect(within(dialogo).getByText(/O valor oficial é calculado pela API ao registrar a devolução/)).toHaveTextContent('Estimativa:');

    await usuario.clear(km);
    await usuario.type(km, '32850');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Registrar devolução' }));

    expect(await screen.findByText(/Valor total calculado pela API: R\$\s909,30/)).toBeInTheDocument();
    const put = api.chamadas.find((c) => c.metodo === 'PUT')?.corpo as Record<string, unknown>;
    expect(put).toMatchObject({
      clienteId: 2,
      veiculoId: 2,
      dataInicio: '2026-11-18T09:00:00',
      dataFimPrevista: '2026-11-22T09:00:00',
      quilometragemInicial: 32400,
      quilometragemFinal: 32850,
      valorDiaria: 129.9,
    });
    expect(put.dataDevolucao).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00$/);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('impede quilometragem final menor que a inicial', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      ...apoio,
      'GET /api/Alugueis': () => json([aluguelEmAberto]),
      'GET /api/Alugueis/16': () => json(aluguelEmAberto),
    });
    renderizarApp('/alugueis');

    await usuario.click(await screen.findByRole('button', { name: 'Registrar devolução do aluguel 16' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Registrar devolução' });
    const km = await within(dialogo).findByLabelText(/^Quilometragem final/);
    await usuario.clear(km);
    await usuario.type(km, '100');
    await usuario.click(within(dialogo).getByRole('button', { name: 'Registrar devolução' }));

    expect((await within(dialogo).findAllByText('A quilometragem final não pode ser inferior à quilometragem inicial.')).length).toBeGreaterThan(0);
    expect(api.chamadas.some((c) => c.metodo === 'PUT')).toBe(false);
  });

  it('mostra o erro da API dentro da janela de devolução', async () => {
    const usuario = userEvent.setup();
    instalarApiFalsa({
      ...apoio,
      'GET /api/Alugueis': () => json([aluguelEmAberto]),
      'GET /api/Alugueis/16': () => json(aluguelEmAberto),
      'PUT /api/Alugueis/16': () => json({ mensagem: 'O cliente informado não existe.' }, 400),
    });
    renderizarApp('/alugueis');

    await usuario.click(await screen.findByRole('button', { name: 'Registrar devolução do aluguel 16' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Registrar devolução' });
    await within(dialogo).findByLabelText(/^Quilometragem final/);
    await usuario.click(within(dialogo).getByRole('button', { name: 'Registrar devolução' }));

    expect(await within(dialogo).findByRole('alert')).toHaveTextContent('O cliente informado não existe.');
  });

  it('permite fechar a janela sem registrar nada', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      ...apoio,
      'GET /api/Alugueis': () => json([aluguelEmAberto]),
      'GET /api/Alugueis/16': () => json(aluguelEmAberto),
    });
    renderizarApp('/alugueis');

    await usuario.click(await screen.findByRole('button', { name: 'Registrar devolução do aluguel 16' }));
    const dialogo = await screen.findByRole('dialog', { name: 'Registrar devolução' });
    await usuario.click(await within(dialogo).findByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.chamadas.some((c) => c.metodo === 'PUT')).toBe(false);
  });
});

describe('Aluguéis — formulário', () => {
  const disponiveis = [veiculos[0]];

  it('oferece apenas veículos disponíveis e sugere a quilometragem do veículo escolhido', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      'GET /api/Clientes': () => json(clientes),
      'GET /api/Veiculos/filtro/disponiveis': () => json(disponiveis),
    });
    renderizarApp('/alugueis/novo');

    await screen.findByRole('option', { name: 'ABC1D23 · Fiat Mobi' });
    expect(api.urls()).toContain('GET /api/Veiculos/filtro/disponiveis');
    expect(screen.queryByRole('option', { name: /FGH2E34/ })).not.toBeInTheDocument();

    await usuario.selectOptions(screen.getByLabelText(/^Veículo/), 'ABC1D23 · Fiat Mobi');
    expect(screen.getByLabelText(/^Quilometragem inicial/)).toHaveValue(18500);
    expect(screen.getByText('Quilometragem atual do veículo: 18.500 km')).toBeInTheDocument();
  });

  it('abre com cliente e veículo pré-selecionados pelos parâmetros da URL', async () => {
    instalarApiFalsa({
      'GET /api/Clientes': () => json(clientes),
      'GET /api/Veiculos/filtro/disponiveis': () => json(disponiveis),
    });
    renderizarApp('/alugueis/novo?clienteId=2&veiculoId=1');

    expect(await screen.findByLabelText(/^Cliente/)).toHaveValue('2');
    expect(screen.getByLabelText(/^Veículo/)).toHaveValue('1');
    expect(screen.getByLabelText(/^Quilometragem inicial/)).toHaveValue(18500);
  });

  it('valida fim previsto, devolução e quilometragens antes de enviar', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      'GET /api/Clientes': () => json(clientes),
      'GET /api/Veiculos/filtro/disponiveis': () => json(disponiveis),
    });
    renderizarApp('/alugueis/novo');
    await screen.findByRole('option', { name: 'ABC1D23 · Fiat Mobi' });

    await usuario.selectOptions(screen.getByLabelText(/^Cliente/), 'Rafael Tavares');
    await usuario.selectOptions(screen.getByLabelText(/^Veículo/), 'ABC1D23 · Fiat Mobi');
    fireEvent.change(screen.getByLabelText(/^Início/), { target: { value: '2026-11-24T09:00' } });
    fireEvent.change(screen.getByLabelText(/^Fim previsto/), { target: { value: '2026-11-23T09:00' } });
    await usuario.type(screen.getByLabelText(/^Valor da diária/), '119.9');
    fireEvent.change(screen.getByLabelText(/^Data e hora da devolução/), { target: { value: '2026-11-20T09:00' } });
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

    const resumo = await screen.findByRole('alert');
    expect(resumo).toHaveTextContent('A data de fim prevista deve ser posterior à data de início.');
    expect(resumo).toHaveTextContent('A data de devolução não pode ser anterior à data de início.');
    expect(resumo).toHaveTextContent('Informe a quilometragem final ao registrar a devolução.');
    expect(api.chamadas.some((c) => c.metodo === 'POST')).toBe(false);
  });

  it('cadastra o aluguel e avisa o sucesso', async () => {
    const usuario = userEvent.setup();
    const api = instalarApiFalsa({
      'GET /api/Clientes': () => json(clientes),
      'GET /api/Veiculos/filtro/disponiveis': () => json(disponiveis),
      'POST /api/Alugueis': () => json({ ...aluguelEmAberto, id: 30, situacao: 'EmAndamento' }, 201),
      'GET /api/Alugueis': () => json([]),
      'GET /api/Veiculos': () => json(veiculos),
    });
    renderizarApp('/alugueis/novo');
    await screen.findByRole('option', { name: 'ABC1D23 · Fiat Mobi' });

    await usuario.selectOptions(screen.getByLabelText(/^Cliente/), 'Rafael Tavares');
    await usuario.selectOptions(screen.getByLabelText(/^Veículo/), 'ABC1D23 · Fiat Mobi');
    fireEvent.change(screen.getByLabelText(/^Início/), { target: { value: '2026-11-24T09:00' } });
    fireEvent.change(screen.getByLabelText(/^Fim previsto/), { target: { value: '2026-11-27T09:00' } });
    await usuario.type(screen.getByLabelText(/^Valor da diária/), '119.9');
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Aluguel #30 registrado com sucesso.')).toBeInTheDocument();
    expect(api.chamadas.find((c) => c.metodo === 'POST')?.corpo).toEqual({
      clienteId: 2,
      veiculoId: 1,
      dataInicio: '2026-11-24T09:00:00',
      dataFimPrevista: '2026-11-27T09:00:00',
      dataDevolucao: null,
      quilometragemInicial: 18500,
      quilometragemFinal: null,
      valorDiaria: 119.9,
    });
  });

  it('exibe o conflito 409 quando o veículo já está alugado', async () => {
    const usuario = userEvent.setup();
    instalarApiFalsa({
      'GET /api/Clientes': () => json(clientes),
      'GET /api/Veiculos/filtro/disponiveis': () => json(disponiveis),
      'POST /api/Alugueis': () => json({ mensagem: 'O veículo informado já possui um aluguel em andamento.' }, 409),
    });
    renderizarApp('/alugueis/novo?clienteId=2&veiculoId=1');
    await screen.findByRole('option', { name: 'ABC1D23 · Fiat Mobi' });

    await usuario.type(screen.getByLabelText(/^Valor da diária/), '100');
    await usuario.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('O veículo informado já possui um aluguel em andamento.');
  });

  it('na edição mostra todos os veículos, o total oficial e uma estimativa identificada', async () => {
    instalarApiFalsa({
      'GET /api/Clientes': () => json(clientes),
      'GET /api/Veiculos': () => json(veiculos),
      'GET /api/Alugueis/11': () => json(aluguelDevolvido),
    });
    renderizarApp('/alugueis/11/editar');

    expect(await screen.findByRole('option', { name: /FGH2E34 · Fiat Argo/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Quilometragem final/)).toHaveValue(32630);
    expect(screen.getByText(/Valor total registrado pela API/)).toHaveTextContent('259,80');
    expect(screen.getByText(/O valor oficial é calculado pela API ao salvar/)).toHaveTextContent('Estimativa:');
  });
});
