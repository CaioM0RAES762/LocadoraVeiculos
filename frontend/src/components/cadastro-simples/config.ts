import type { FiltrosFabricante } from '../../types/api';

export interface RegistroSimples {
  id: number;
  nome: string;
}

/** Textos e serviço de uma entidade que possui apenas "nome" (fabricante e categoria). */
export interface ConfigCadastroSimples<T extends RegistroSimples> {
  /** Caminho base da tela, ex.: "/fabricantes". */
  rota: string;
  /** Segmento de criação ("novo" ou "nova"). */
  segmentoNovo: string;
  tituloPlural: string;
  singular: string;
  /** "Fabricante", "Categoria" (início de frase). */
  substantivo: string;
  artigoDefinido: 'o' | 'a';
  artigoIndefinido: 'um' | 'uma';
  rotuloNovo: string;
  /** "excluído" | "excluída" */
  excluido: string;
  cadastrado: string;
  atualizado: string;
  descricao: string;
  maxNome: number;
  api: {
    listar: (filtros: FiltrosFabricante, signal?: AbortSignal) => Promise<T[]>;
    obter: (id: number, signal?: AbortSignal) => Promise<T>;
    criar: (dados: { nome: string }) => Promise<T>;
    atualizar: (id: number, dados: { nome: string }) => Promise<unknown>;
    excluir: (id: number) => Promise<unknown>;
  };
}
