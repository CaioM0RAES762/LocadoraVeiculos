import { useEffect, useEffectEvent, useState } from 'react';
import { ehAbort } from '../services/http';

interface Estado<T> {
  chave: string;
  data?: T;
  error?: Error;
}

export interface ResultadoAsync<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
}

/**
 * Carrega dados assíncronos quando `chave` muda (ou ao chamar `reload`), cancelando a requisição anterior.
 * `loading` é derivado da chave: enquanto o resultado guardado não pertence à consulta atual, está carregando.
 */
export function useAsyncData<T>(carregar: (signal: AbortSignal) => Promise<T>, chave: string): ResultadoAsync<T> {
  const [recarga, setRecarga] = useState(0);
  const [estado, setEstado] = useState<Estado<T> | null>(null);
  const chaveAtual = `${chave}#${recarga}`;
  const executar = useEffectEvent(carregar);

  useEffect(() => {
    const controle = new AbortController();

    executar(controle.signal).then(
      (data) => setEstado({ chave: chaveAtual, data }),
      (erro: unknown) => {
        if (ehAbort(erro)) return;
        setEstado({ chave: chaveAtual, error: erro instanceof Error ? erro : new Error(String(erro)) });
      },
    );

    return () => controle.abort();
  }, [chaveAtual]);

  const concluido = estado?.chave === chaveAtual;

  return {
    data: concluido ? estado.data : undefined,
    error: concluido ? estado.error : undefined,
    loading: !concluido,
    reload: () => setRecarga((n) => n + 1),
  };
}
