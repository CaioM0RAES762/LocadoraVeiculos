import type { Aluguel, AluguelDoCliente, AluguelInput, AluguelPeriodo, FiltrosAluguel } from '../types/api';
import { comQuery, criarCrud, request } from './http';

const BASE = '/api/Alugueis';

export const rotasAlugueis = {
  listar: (filtros?: FiltrosAluguel) => comQuery(BASE, { ...filtros }),
  porPeriodo: (inicio: string, fim: string) => comQuery(`${BASE}/filtro/periodo`, { inicio, fim }),
  porCliente: (clienteId: number) => `${BASE}/filtro/cliente/${clienteId}`,
};

export const alugueisApi = {
  ...criarCrud<Aluguel, AluguelInput>(BASE),
  listar: (filtros?: FiltrosAluguel, signal?: AbortSignal) =>
    request<Aluguel[]>(rotasAlugueis.listar(filtros), { signal }),
  /** INNER JOIN no banco: aluguéis iniciados dentro do período informado. */
  listarPorPeriodo: (inicio: string, fim: string, signal?: AbortSignal) =>
    request<AluguelPeriodo[]>(rotasAlugueis.porPeriodo(inicio, fim), { signal }),
  /** INNER JOIN no banco: histórico de aluguéis de um cliente. */
  listarPorCliente: (clienteId: number, signal?: AbortSignal) =>
    request<AluguelDoCliente[]>(rotasAlugueis.porCliente(clienteId), { signal }),
};
