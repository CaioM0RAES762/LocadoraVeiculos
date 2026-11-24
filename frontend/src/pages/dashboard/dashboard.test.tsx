import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aluguelDevolvido, aluguelEmAberto, categorias, clientes, fabricantes, instalarApiFalsa, json, renderizarApp, veiculos } from '../../test/utils';

afterEach(() => vi.unstubAllGlobals());

const rotasPainel = {
  'GET /api/Fabricantes': () => json(fabricantes),
  'GET /api/Categorias': () => json(categorias),
  'GET /api/Clientes': () => json(clientes),
  'GET /api/Veiculos': () => json(veiculos),
  'GET /api/Veiculos/filtro/disponiveis': () => json([veiculos[0]]),
  'GET /api/Alugueis': () => json([aluguelEmAberto, aluguelDevolvido, { ...aluguelEmAberto, id: 17, situacao: 'EmAndamento' }]),
};

async function indicador(rotulo: string) {
  const area = await screen.findByRole('region', { name: 'Indicadores' });
  const ligacao = within(area).getByRole('link', { name: new RegExp(rotulo) });
  return within(ligacao).getByText(/^\d+$/);
}

describe('Painel', () => {
  it('mostra indicadores calculados com dados reais da API', async () => {
    instalarApiFalsa(rotasPainel);
    renderizarApp('/');

    expect(await indicador('Fabricantes')).toHaveTextContent('2');
    expect(await indicador('Categorias')).toHaveTextContent('2');
    expect(await indicador('Clientes')).toHaveTextContent('2');
    expect(await indicador('^\\d+Veículos$')).toHaveTextContent('2');
    expect(await indicador('Veículos disponíveis')).toHaveTextContent('1');
    expect(await indicador('Aluguéis em andamento')).toHaveTextContent('1');
    expect(await indicador('Aluguéis atrasados')).toHaveTextContent('1');
  });

  it('lista os aluguéis em aberto e oferece atalhos de cadastro e consultas', async () => {
    instalarApiFalsa(rotasPainel);
    renderizarApp('/');

    const tabela = await screen.findByRole('table', { name: /Aluguéis em aberto/ });
    expect(within(tabela).getAllByText('Rafael Tavares')).toHaveLength(2);
    expect(within(tabela).queryByText('Devolvido')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Novo aluguel' })).toHaveAttribute('href', '/alugueis/novo');
    expect(screen.getByRole('link', { name: 'Nova categoria' })).toHaveAttribute('href', '/categorias/nova');
    expect(screen.getByRole('link', { name: 'Veículos disponíveis' })).toHaveAttribute('href', '/veiculos?consulta=disponiveis');
  });

  it('mostra erro com opção de tentar novamente quando a API falha', async () => {
    const usuario = userEvent.setup();
    let falhar = true;
    instalarApiFalsa({
      ...rotasPainel,
      'GET /api/Fabricantes': () => (falhar ? Promise.resolve(json({ mensagem: 'Ocorreu um erro inesperado ao processar a requisição.' }, 500)) : Promise.resolve(json(fabricantes))),
    });
    renderizarApp('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocorreu um erro inesperado ao processar a requisição.');
    falhar = false;
    await usuario.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await indicador('Fabricantes')).toHaveTextContent('2');
  });
});

describe('Navegação', () => {
  it('permite chegar às telas pelo menu lateral', async () => {
    const usuario = userEvent.setup();
    instalarApiFalsa({ ...rotasPainel });
    renderizarApp('/');

    const menu = screen.getByRole('navigation', { name: 'Principal' });
    for (const item of ['Painel', 'Aluguéis', 'Veículos', 'Clientes', 'Fabricantes', 'Categorias']) {
      expect(within(menu).getByRole('link', { name: item })).toBeInTheDocument();
    }

    await usuario.click(within(menu).getByRole('link', { name: 'Clientes' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Clientes' })).toBeInTheDocument();
    expect(within(menu).getByRole('link', { name: 'Clientes' })).toHaveAttribute('aria-current', 'page');
  });

  it('mostra a página de rota inexistente com caminho de volta', () => {
    instalarApiFalsa({});
    renderizarApp('/qualquer/coisa');
    expect(screen.getByRole('heading', { level: 1, name: 'Página não encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao painel' })).toHaveAttribute('href', '/');
  });

  it('oferece link para pular ao conteúdo principal', () => {
    instalarApiFalsa({});
    renderizarApp('/qualquer');
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo');
  });
});
