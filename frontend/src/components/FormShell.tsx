import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { Button, ButtonLink } from './Button';

interface Props {
  /** Mensagens de erro a resumir no topo (validação local e respostas da API). */
  erros: string[];
  enviando: boolean;
  cancelarPara: string;
  rotuloSalvar?: string;
  onSubmit: () => void;
  children: ReactNode;
}

/** Estrutura comum dos formulários: resumo de erros acessível, botões de ação e bloqueio durante o envio. */
export function FormShell({ erros, enviando, cancelarPara, rotuloSalvar = 'Salvar', onSubmit, children }: Props) {
  const resumo = useRef<HTMLDivElement>(null);
  const chaveErros = erros.join('|');

  // Quando surgem erros, leva o foco ao resumo para leitores de tela e para quem navega por teclado.
  useEffect(() => {
    if (chaveErros) resumo.current?.focus();
  }, [chaveErros]);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!enviando) onSubmit();
  }

  return (
    <form className="formulario" noValidate onSubmit={enviar}>
      {erros.length > 0 && (
        <div className="resumo-erros" role="alert" tabIndex={-1} ref={resumo}>
          <strong>Corrija os itens abaixo para continuar:</strong>
          <ul>
            {erros.map((erro) => (
              <li key={erro}>{erro}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="formulario__campos">{children}</div>

      <div className="formulario__acoes">
        <Button type="submit" variante="primario" icone="ok" disabled={enviando}>
          {enviando ? 'Salvando…' : rotuloSalvar}
        </Button>
        <ButtonLink to={cancelarPara}>Cancelar</ButtonLink>
      </div>
    </form>
  );
}
