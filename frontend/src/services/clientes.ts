import type { Cliente, ClienteInput, FiltrosCliente } from '../types/api';
import { comQuery, criarCrud, request } from './http';

const BASE = '/api/Clientes';

export const rotasClientes = {
  listar: (filtros?: FiltrosCliente) => comQuery(BASE, { ...filtros }),
  semAlugueis: () => `${BASE}/filtro/sem-alugueis`,
};

export const clientesApi = {
  ...criarCrud<Cliente, ClienteInput>(BASE),
  listar: (filtros?: FiltrosCliente, signal?: AbortSignal) =>
    request<Cliente[]>(rotasClientes.listar(filtros), { signal }),
  /** LEFT JOIN no banco: clientes que nunca alugaram um veículo. */
  listarSemAlugueis: (signal?: AbortSignal) => request<Cliente[]>(rotasClientes.semAlugueis(), { signal }),
};
