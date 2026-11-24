/**
 * Validações de formulário. Espelham as regras dos DTOs da API apenas para dar retorno imediato ao usuário;
 * a API continua sendo a fonte oficial e suas mensagens também são exibidas.
 */
import { somenteDigitos } from './formatters';

export const REGEX_PLACA = /^[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}$/;
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Erro = string | undefined;

export function validarTextoObrigatorio(valor: string, rotulo: string, max: number): Erro {
  const texto = valor.trim();
  if (!texto) return `${rotulo} é obrigatório.`;
  if (texto.length > max) return `${rotulo} deve ter no máximo ${max} caracteres.`;
  return undefined;
}

export function validarCpf(valor: string): Erro {
  if (!valor.trim()) return 'O CPF é obrigatório.';
  if (somenteDigitos(valor).length !== 11) return 'O CPF deve conter exatamente 11 dígitos numéricos.';
  return undefined;
}

export function validarEmail(valor: string): Erro {
  const texto = valor.trim();
  if (!texto) return 'O e-mail é obrigatório.';
  if (texto.length > 150) return 'O e-mail deve ter no máximo 150 caracteres.';
  if (!REGEX_EMAIL.test(texto)) return 'O e-mail informado não é válido.';
  return undefined;
}

export function validarPlaca(valor: string): Erro {
  const texto = valor.trim();
  if (!texto) return 'A placa é obrigatória.';
  if (!REGEX_PLACA.test(texto)) return 'A placa deve estar no formato ABC1234, ABC-1234 ou ABC1D23.';
  return undefined;
}

interface LimitesNumero {
  min?: number;
  max?: number;
  mensagemFaixa?: string;
}

/** Valida um número inteiro digitado em um campo de texto/numérico. */
export function validarInteiro(valor: string, rotulo: string, limites: LimitesNumero = {}): Erro {
  const texto = valor.trim();
  if (!texto) return `${rotulo} é obrigatório.`;
  if (!/^-?\d+$/.test(texto)) return `${rotulo} deve ser um número inteiro.`;
  const numero = Number(texto);
  const { min, max, mensagemFaixa } = limites;
  if ((min !== undefined && numero < min) || (max !== undefined && numero > max)) {
    return mensagemFaixa ?? `${rotulo} está fora do intervalo permitido.`;
  }
  return undefined;
}

export function validarSelecao(valor: string, rotulo: string): Erro {
  return valor ? undefined : `Selecione ${rotulo}.`;
}

export function validarValorDiaria(valor: string): Erro {
  const texto = valor.trim().replace(',', '.');
  if (!texto) return 'O valor da diária é obrigatório.';
  const numero = Number(texto);
  if (Number.isNaN(numero)) return 'O valor da diária deve ser um número.';
  if (numero <= 0 || numero > 99999999.99) {
    return 'O valor da diária deve ser maior que zero e no máximo 99.999.999,99.';
  }
  return undefined;
}

export function temErros(erros: Record<string, Erro>): boolean {
  return Object.values(erros).some(Boolean);
}
