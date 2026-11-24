import type { Categoria, CategoriaInput, FiltrosCategoria } from '../types/api';
import { comQuery, criarCrud, request } from './http';

const BASE = '/api/Categorias';

export const rotasCategorias = {
  listar: (filtros?: FiltrosCategoria) => comQuery(BASE, { ...filtros }),
};

export const categoriasApi = {
  ...criarCrud<Categoria, CategoriaInput>(BASE),
  listar: (filtros?: FiltrosCategoria, signal?: AbortSignal) =>
    request<Categoria[]>(rotasCategorias.listar(filtros), { signal }),
};
