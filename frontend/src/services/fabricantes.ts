import type { Fabricante, FabricanteInput, FiltrosFabricante } from '../types/api';
import { comQuery, criarCrud, request } from './http';

const BASE = '/api/Fabricantes';

export const rotasFabricantes = {
  listar: (filtros?: FiltrosFabricante) => comQuery(BASE, { ...filtros }),
};

export const fabricantesApi = {
  ...criarCrud<Fabricante, FabricanteInput>(BASE),
  listar: (filtros?: FiltrosFabricante, signal?: AbortSignal) =>
    request<Fabricante[]>(rotasFabricantes.listar(filtros), { signal }),
};
