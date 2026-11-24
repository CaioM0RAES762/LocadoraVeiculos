/**
 * Cliente HTTP único da aplicação. Todas as chamadas à API passam por aqui, o que centraliza
 * a URL base (VITE_API_URL), o tratamento de status e a conversão dos erros em mensagens legíveis.
 */

export type ErroKind = 'rede' | 'http' | 'resposta-invalida';

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ErroKind;
  /** Mensagens por campo (chaves em camelCase) quando a API devolve ValidationProblemDetails. */
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status: number, kind: ErroKind, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.fieldErrors = fieldErrors;
  }
}

export const MENSAGEM_API_INDISPONIVEL =
  'Não foi possível conectar à API. Verifique se o servidor está em execução e tente novamente.';

type ParametrosQuery = Record<string, string | number | boolean | null | undefined>;

/** Acrescenta à rota apenas os parâmetros preenchidos (ignora vazios, nulos e indefinidos). */
export function comQuery(rota: string, parametros?: ParametrosQuery): string {
  if (!parametros) return rota;

  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === null) continue;
    const texto = String(valor).trim();
    if (texto !== '') busca.set(chave, texto);
  }

  const query = busca.toString();
  return query ? `${rota}?${query}` : rota;
}

function urlBase(): string {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
}

function normalizarChave(chave: string): string {
  const semPrefixo = chave.replace(/^\$\.?/, '');
  return semPrefixo.charAt(0).toLowerCase() + semPrefixo.slice(1);
}

interface CorpoErro {
  mensagem?: unknown;
  title?: unknown;
  errors?: unknown;
}

function interpretarErro(status: number, texto: string): ApiError {
  let corpo: CorpoErro | null = null;
  try {
    const analisado: unknown = JSON.parse(texto);
    if (analisado && typeof analisado === 'object') corpo = analisado as CorpoErro;
  } catch {
    corpo = null;
  }

  // Sem corpo JSON em erro 5xx: normalmente é o proxy do Vite sem conseguir falar com a API.
  if (!corpo && status >= 500) {
    return new ApiError(MENSAGEM_API_INDISPONIVEL, status, 'rede');
  }

  const fieldErrors: Record<string, string> = {};
  const mensagens: string[] = [];

  if (corpo?.errors && typeof corpo.errors === 'object') {
    for (const [campo, lista] of Object.entries(corpo.errors as Record<string, unknown>)) {
      const primeira = Array.isArray(lista) ? lista.find((m): m is string => typeof m === 'string') : undefined;
      if (primeira) {
        fieldErrors[normalizarChave(campo)] = primeira;
        mensagens.push(primeira);
      }
    }
  }

  if (typeof corpo?.mensagem === 'string' && corpo.mensagem) {
    return new ApiError(corpo.mensagem, status, 'http');
  }

  if (mensagens.length > 0) {
    return new ApiError(mensagens.join(' '), status, 'http', fieldErrors);
  }

  const padrao: Record<number, string> = {
    400: 'Os dados enviados são inválidos.',
    404: 'O registro solicitado não foi encontrado.',
    409: 'A operação não pôde ser concluída por causa de um conflito com outros registros.',
    415: 'A API não aceitou o formato dos dados enviados.',
  };

  return new ApiError(padrao[status] ?? `A API respondeu com o erro HTTP ${status}.`, status, 'http');
}

interface OpcoesRequisicao {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/** Executa a requisição e devolve o JSON já convertido (ou `undefined` em respostas 204). */
export async function request<T = void>(rota: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { method = 'GET', body, signal } = opcoes;

  let resposta: Response;
  try {
    resposta = await fetch(`${urlBase()}${rota}`, {
      method,
      signal,
      headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro;
    throw new ApiError(MENSAGEM_API_INDISPONIVEL, 0, 'rede');
  }

  const texto = await resposta.text();

  if (!resposta.ok) throw interpretarErro(resposta.status, texto);

  if (resposta.status === 204 || texto.trim() === '') return undefined as T;

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new ApiError('A API retornou uma resposta inválida (JSON malformado).', resposta.status, 'resposta-invalida');
  }
}

/** Gera as operações REST padrão de uma entidade (`/api/Entidade`). */
export function criarCrud<Entidade, Entrada>(rotaBase: string) {
  return {
    obter: (id: number, signal?: AbortSignal) => request<Entidade>(`${rotaBase}/${id}`, { signal }),
    criar: (dados: Entrada) => request<Entidade>(rotaBase, { method: 'POST', body: dados }),
    atualizar: (id: number, dados: Entrada) => request(`${rotaBase}/${id}`, { method: 'PUT', body: dados }),
    excluir: (id: number) => request(`${rotaBase}/${id}`, { method: 'DELETE' }),
  };
}

export function ehAbort(erro: unknown): boolean {
  return erro instanceof DOMException && erro.name === 'AbortError';
}
