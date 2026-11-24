import type { ReactNode } from 'react';
import { Button } from './Button';
import { Icone } from './Icone';

export function LoadingState({ mensagem = 'Carregando dados…' }: { mensagem?: string }) {
  return (
    <div className="estado" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{mensagem}</p>
    </div>
  );
}

interface EmptyProps {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
}

export function EmptyState({ titulo, descricao, acao }: EmptyProps) {
  return (
    <div className="estado estado--vazio">
      <h3>{titulo}</h3>
      {descricao && <p>{descricao}</p>}
      {acao}
    </div>
  );
}

interface ErrorProps {
  mensagem: string;
  onTentarNovamente?: () => void;
}

export function ErrorState({ mensagem, onTentarNovamente }: ErrorProps) {
  return (
    <div className="estado estado--erro" role="alert">
      <Icone nome="alerta" tamanho={28} />
      <h3>Não foi possível carregar os dados</h3>
      <p>{mensagem}</p>
      {onTentarNovamente && (
        <Button onClick={onTentarNovamente} icone="devolver">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
