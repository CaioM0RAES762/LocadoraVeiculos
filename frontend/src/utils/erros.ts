import { ApiError } from '../services/http';

/** Converte qualquer erro capturado em uma mensagem apresentável ao usuário. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message;
  if (erro instanceof Error && erro.message) return erro.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
