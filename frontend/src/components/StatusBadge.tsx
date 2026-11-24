import type { ReactNode } from 'react';
import type { SituacaoAluguel } from '../types/api';
import { ROTULO_SITUACAO, TOM_SITUACAO, type TomBadge } from '../utils/aluguel';

export function StatusBadge({ tom, children }: { tom: TomBadge; children: ReactNode }) {
  return <span className={`badge badge--${tom}`}>{children}</span>;
}

export function SituacaoBadge({ situacao }: { situacao: SituacaoAluguel }) {
  return <StatusBadge tom={TOM_SITUACAO[situacao]}>{ROTULO_SITUACAO[situacao]}</StatusBadge>;
}

export function DisponibilidadeBadge({ disponivel }: { disponivel: boolean }) {
  return disponivel ? <StatusBadge tom="sucesso">Disponível</StatusBadge> : <StatusBadge tom="aviso">Em locação</StatusBadge>;
}
