import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}

/** Diálogo modal baseado no elemento nativo <dialog>: prende o foco, fecha com Esc e devolve o foco ao acionador. */
export function Dialog({ aberto, titulo, onFechar, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (aberto && !dialogo.open) dialogo.showModal();
    if (!aberto && dialogo.open) dialogo.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        evento.preventDefault();
        onFechar();
      }}
      onClick={(evento) => {
        if (evento.target === ref.current) onFechar();
      }}
    >
      {aberto && (
        <div className="dialogo__conteudo">
          <h2 id={idTitulo} className="dialogo__titulo">
            {titulo}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
