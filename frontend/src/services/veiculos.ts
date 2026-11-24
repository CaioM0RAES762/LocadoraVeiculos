import type { FiltrosVeiculo, Veiculo, VeiculoInput } from '../types/api';
import { comQuery, criarCrud, request } from './http';

const BASE = '/api/Veiculos';

export const rotasVeiculos = {
  listar: (filtros?: FiltrosVeiculo) => comQuery(BASE, { ...filtros }),
  disponiveis: () => `${BASE}/filtro/disponiveis`,
  porFabricante: (nome: string) => comQuery(`${BASE}/filtro/fabricante`, { nome }),
};

export const veiculosApi = {
  ...criarCrud<Veiculo, VeiculoInput>(BASE),
  listar: (filtros?: FiltrosVeiculo, signal?: AbortSignal) =>
    request<Veiculo[]>(rotasVeiculos.listar(filtros), { signal }),
  /** LEFT JOIN no banco: veículos sem aluguel em aberto (sem devolução). */
  listarDisponiveis: (signal?: AbortSignal) => request<Veiculo[]>(rotasVeiculos.disponiveis(), { signal }),
  /** INNER JOIN no banco: veículos cujo fabricante contém o nome informado. */
  listarPorFabricante: (nome: string, signal?: AbortSignal) =>
    request<Veiculo[]>(rotasVeiculos.porFabricante(nome), { signal }),
};
