import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { App } from '../App';
import { ToastProvider } from '../components/ToastProvider';

/**
 * Os mocks existem SOMENTE nos testes automatizados: a aplicação entregue sempre conversa com a API real.
 * Aqui `fetch` é substituído por uma API falsa para exercitar telas, rotas e tratamento de erros isoladamente.
 */
export interface Chamada {
  metodo: string;
  url: string;
  corpo?: unknown;
}

export type Manipulador = (chamada: Chamada) => Response | Promise<Response>;

export const json = (dados: unknown, status = 200): Response =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } });

export const semConteudo = (): Response => new Response(null, { status: 204 });

export function instalarApiFalsa(rotas: Record<string, Manipulador>) {
  const chamadas: Chamada[] = [];

  const falso = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada);
    const metodo = (init?.method ?? 'GET').toUpperCase();
    const chamada: Chamada = { metodo, url, corpo: init?.body ? JSON.parse(String(init.body)) : undefined };
    chamadas.push(chamada);

    const manipulador = rotas[`${metodo} ${url}`] ?? rotas[`${metodo} ${url.split('?')[0]}`];
    if (!manipulador) throw new Error(`Rota não simulada no teste: ${metodo} ${url}`);
    return manipulador(chamada);
  });

  vi.stubGlobal('fetch', falso);
  return { chamadas, urls: () => chamadas.map((c) => `${c.metodo} ${c.url}`) };
}

export function renderizarApp(rota = '/') {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </MemoryRouter>,
  );
}

export const fabricantes = [
  { id: 1, nome: 'Fiat' },
  { id: 2, nome: 'Volkswagen' },
];

export const categorias = [
  { id: 1, nome: 'Econômico' },
  { id: 3, nome: 'SUV' },
];

export const clientes = [
  { id: 1, nome: 'Mariana Albuquerque', cpf: '10203040570', email: 'mariana.albuquerque@exemplo.test' },
  { id: 2, nome: 'Rafael Tavares', cpf: '21436587964', email: 'rafael.tavares@exemplo.test' },
];

export const veiculos = [
  { id: 1, placa: 'ABC1D23', modelo: 'Mobi', anoFabricacao: 2023, quilometragem: 18500, fabricanteId: 1, fabricante: 'Fiat', categoriaId: 1, categoria: 'Econômico', disponivel: true },
  { id: 2, placa: 'FGH2E34', modelo: 'Argo', anoFabricacao: 2022, quilometragem: 32400, fabricanteId: 1, fabricante: 'Fiat', categoriaId: 1, categoria: 'Econômico', disponivel: false },
];

export const aluguelEmAberto = {
  id: 16,
  clienteId: 2,
  cliente: 'Rafael Tavares',
  veiculoId: 2,
  placa: 'FGH2E34',
  modelo: 'Argo',
  dataInicio: '2026-11-18T09:00:00',
  dataFimPrevista: '2026-11-22T09:00:00',
  dataDevolucao: null,
  quilometragemInicial: 32400,
  quilometragemFinal: null,
  valorDiaria: 129.9,
  valorTotal: null,
  situacao: 'Atrasado',
};

export const aluguelDevolvido = {
  ...aluguelEmAberto,
  id: 11,
  dataDevolucao: '2026-11-20T09:00:00',
  quilometragemFinal: 32630,
  valorTotal: 259.8,
  situacao: 'Devolvido',
};
