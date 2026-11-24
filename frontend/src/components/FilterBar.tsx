import type { FormEvent, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  rotulo: string;
  onFiltrar: () => void;
  onLimpar: () => void;
  rotuloFiltrar?: string;
  children: ReactNode;
}

/** Barra de filtros: os campos são fornecidos pela página; aplicar atualiza a URL e dispara nova consulta. */
export function FilterBar({ rotulo, onFiltrar, onLimpar, rotuloFiltrar = 'Filtrar', children }: Props) {
  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onFiltrar();
  }

  return (
    <form className="filtros" role="search" aria-label={rotulo} onSubmit={enviar}>
      <div className="filtros__campos">{children}</div>
      <div className="filtros__acoes">
        <Button type="submit" variante="primario" icone="buscar">
          {rotuloFiltrar}
        </Button>
        <Button onClick={onLimpar}>Limpar</Button>
      </div>
    </form>
  );
}
