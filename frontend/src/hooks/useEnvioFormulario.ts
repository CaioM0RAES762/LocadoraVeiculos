import { useState } from 'react';
import { ApiError } from '../services/http';
import { mensagemDeErro } from '../utils/erros';

type Erros<K extends string> = Partial<Record<K, string>>;

/**
 * Controla o envio de um formulário: valida localmente, chama a API e converte a resposta de erro
 * (campo a campo ou mensagem geral) em estado para exibição. Retorna `true` quando o envio foi concluído.
 */
export function useEnvioFormulario<K extends string>() {
  const [erros, setErros] = useState<Erros<K>>({});
  const [erroGeral, setErroGeral] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  async function executar(validacao: Erros<K>, acao: () => Promise<unknown>): Promise<boolean> {
    setErroGeral(undefined);

    if (Object.values(validacao).some(Boolean)) {
      setErros(validacao);
      return false;
    }

    setErros({});
    setEnviando(true);
    try {
      await acao();
      return true;
    } catch (erro) {
      if (erro instanceof ApiError && Object.keys(erro.fieldErrors).length > 0) {
        setErros(erro.fieldErrors as Erros<K>);
      } else {
        setErroGeral(mensagemDeErro(erro));
      }
      return false;
    } finally {
      setEnviando(false);
    }
  }

  const resumo = [erroGeral, ...Object.values<string | undefined>(erros)].filter(
    (mensagem, indice, lista): mensagem is string => Boolean(mensagem) && lista.indexOf(mensagem) === indice,
  );

  return { erros, enviando, resumo, executar };
}
