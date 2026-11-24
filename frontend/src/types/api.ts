/** Tipos que espelham os contratos JSON da API (ASP.NET Core, propriedades em camelCase). */

export interface Fabricante {
  id: number;
  nome: string;
}

export interface Categoria {
  id: number;
  nome: string;
}

export interface Cliente {
  id: number;
  nome: string;
  /** Somente os 11 dígitos, sem máscara. */
  cpf: string;
  email: string;
}

export interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  anoFabricacao: number;
  quilometragem: number;
  fabricanteId: number;
  fabricante: string;
  categoriaId: number;
  categoria: string;
  disponivel: boolean;
}

export type SituacaoAluguel = 'EmAndamento' | 'Atrasado' | 'Devolvido';

/** Resposta de GET /api/Alugueis/filtro/periodo. */
export interface AluguelPeriodo {
  id: number;
  clienteId: number;
  cliente: string;
  veiculoId: number;
  placa: string;
  modelo: string;
  dataInicio: string;
  dataFimPrevista: string;
  dataDevolucao: string | null;
  valorDiaria: number;
  valorTotal: number | null;
  situacao: SituacaoAluguel;
}

/** Resposta de GET /api/Alugueis e GET /api/Alugueis/{id}. */
export interface Aluguel extends AluguelPeriodo {
  quilometragemInicial: number;
  quilometragemFinal: number | null;
}

/** Resposta de GET /api/Alugueis/filtro/cliente/{clienteId}. */
export interface AluguelDoCliente {
  id: number;
  veiculoId: number;
  placa: string;
  modelo: string;
  fabricante: string;
  dataInicio: string;
  dataFimPrevista: string;
  dataDevolucao: string | null;
  quilometragemInicial: number;
  quilometragemFinal: number | null;
  valorDiaria: number;
  valorTotal: number | null;
  situacao: SituacaoAluguel;
}

/** Corpos aceitos em POST e PUT. */
export interface FabricanteInput {
  nome: string;
}

export interface CategoriaInput {
  nome: string;
}

export interface ClienteInput {
  nome: string;
  cpf: string;
  email: string;
}

export interface VeiculoInput {
  placa: string;
  modelo: string;
  anoFabricacao: number;
  quilometragem: number;
  fabricanteId: number;
  categoriaId: number;
}

export interface AluguelInput {
  clienteId: number;
  veiculoId: number;
  /** ISO local sem fuso, ex.: 2026-11-24T09:00:00. */
  dataInicio: string;
  dataFimPrevista: string;
  dataDevolucao: string | null;
  quilometragemInicial: number;
  quilometragemFinal: number | null;
  valorDiaria: number;
}

/** Filtros opcionais aceitos pelos GET de listagem. */
export interface FiltrosFabricante {
  id?: string;
  nome?: string;
}

export type FiltrosCategoria = FiltrosFabricante;

export interface FiltrosCliente {
  nome?: string;
  cpf?: string;
  email?: string;
}

export interface FiltrosVeiculo {
  placa?: string;
  modelo?: string;
  fabricanteId?: string;
  categoriaId?: string;
  /** "true" | "false" | vazio (todos). */
  disponivel?: string;
}

export interface FiltrosAluguel {
  clienteId?: string;
  veiculoId?: string;
  situacao?: string;
  inicio?: string;
  fim?: string;
}
