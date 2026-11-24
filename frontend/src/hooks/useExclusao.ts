import { useState } from 'react';
import { mensagemDeErro } from '../utils/erros';
import { useToast } from './useToast';

interface Opcoes<T extends { id: number }> {
  excluir: (id: number) => Promise<unknown>;
  aoExcluir: () => void;
  mensagemSucesso: (alvo: T) => string;
}

/** Fluxo de exclusão com confirmação: solicitar -> confirmar/cancelar -> mensagem de sucesso ou erro da API. */
export function useExclusao<T extends { id: number }>({ excluir, aoExcluir, mensagemSucesso }: Opcoes<T>) {
  const { notificar } = useToast();
  const [alvo, setAlvo] = useState<T | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function confirmar() {
    if (!alvo) return;
    setOcupado(true);
    try {
      await excluir(alvo.id);
      notificar('sucesso', mensagemSucesso(alvo));
      aoExcluir();
    } catch (erro) {
      notificar('erro', mensagemDeErro(erro));
    } finally {
      setOcupado(false);
      setAlvo(null);
    }
  }

  return { alvo, ocupado, solicitar: setAlvo, cancelar: () => setAlvo(null), confirmar };
}
