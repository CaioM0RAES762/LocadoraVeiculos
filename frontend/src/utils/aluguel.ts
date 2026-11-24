import type { SituacaoAluguel } from '../types/api';

export const SITUACOES: { valor: SituacaoAluguel; rotulo: string }[] = [
  { valor: 'EmAndamento', rotulo: 'Em andamento' },
  { valor: 'Atrasado', rotulo: 'Atrasado' },
  { valor: 'Devolvido', rotulo: 'Devolvido' },
];

export type TomBadge = 'sucesso' | 'aviso' | 'perigo' | 'neutro' | 'info';

export const ROTULO_SITUACAO: Record<SituacaoAluguel, string> = {
  EmAndamento: 'Em andamento',
  Atrasado: 'Atrasado',
  Devolvido: 'Devolvido',
};

export const TOM_SITUACAO: Record<SituacaoAluguel, TomBadge> = {
  EmAndamento: 'info',
  Atrasado: 'perigo',
  Devolvido: 'sucesso',
};

export function estaEmAberto(situacao: SituacaoAluguel): boolean {
  return situacao !== 'Devolvido';
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export interface EstimativaValor {
  diarias: number;
  total: number;
}

/**
 * ESTIMATIVA exibida ao usuário antes de salvar. O valor oficial é sempre calculado e devolvido pela API
 * (cada dia iniciado conta como uma diária, com no mínimo uma).
 */
export function estimarValorTotal(inicio: string, devolucao: string, valorDiaria: number): EstimativaValor | null {
  if (!inicio || !devolucao || !Number.isFinite(valorDiaria) || valorDiaria <= 0) return null;

  const ini = new Date(inicio).getTime();
  const dev = new Date(devolucao).getTime();
  if (Number.isNaN(ini) || Number.isNaN(dev)) return null;

  const diarias = Math.max(1, Math.ceil((dev - ini) / MS_POR_DIA));
  return { diarias, total: Math.round(diarias * valorDiaria * 100) / 100 };
}
