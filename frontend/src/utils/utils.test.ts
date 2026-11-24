import { describe, expect, it } from 'vitest';
import { estaEmAberto, estimarValorTotal } from './aluguel';
import {
  agoraComoCampo,
  deCampoDataHora,
  formatarCpf,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarQuilometragem,
  mascararCpf,
  paraCampoDataHora,
  somenteDigitos,
} from './formatters';
import { validarCpf, validarEmail, validarInteiro, validarPlaca, validarTextoObrigatorio, validarValorDiaria } from './validators';

describe('formatters', () => {
  it('aplica a máscara de CPF progressivamente e limita a 11 dígitos', () => {
    expect(mascararCpf('1')).toBe('1');
    expect(mascararCpf('1020')).toBe('102.0');
    expect(mascararCpf('102030405')).toBe('102.030.405');
    expect(mascararCpf('10203040570')).toBe('102.030.405-70');
    expect(mascararCpf('102.030.405-70999')).toBe('102.030.405-70');
    expect(mascararCpf('abc')).toBe('');
  });

  it('formata CPF armazenado e preserva valores inesperados', () => {
    expect(formatarCpf('10203040570')).toBe('102.030.405-70');
    expect(formatarCpf('123')).toBe('123');
    expect(somenteDigitos('102.030.405-70')).toBe('10203040570');
  });

  it('formata moeda e quilometragem em pt-BR', () => {
    expect(formatarMoeda(119.9).replace(/\s/g, ' ')).toBe('R$ 119,90');
    expect(formatarMoeda(null)).toBe('—');
    expect(formatarQuilometragem(18500).replace(/\s/g, ' ')).toBe('18.500 km');
    expect(formatarQuilometragem(undefined)).toBe('—');
  });

  it('formata e converte datas', () => {
    expect(formatarDataHora('2026-11-24T09:05:00')).toBe('24/11/2026 09:05');
    expect(formatarDataHora(null)).toBe('—');
    expect(formatarData('2026-11-24')).toBe('24/11/2026');
    expect(paraCampoDataHora('2026-11-24T09:05:00')).toBe('2026-11-24T09:05');
    expect(deCampoDataHora('2026-11-24T09:05')).toBe('2026-11-24T09:05:00');
    expect(deCampoDataHora('')).toBeNull();
    expect(agoraComoCampo(new Date(2026, 10, 24, 9, 5))).toBe('2026-11-24T09:05');
  });
});

describe('validators', () => {
  it('valida texto obrigatório e tamanho máximo', () => {
    expect(validarTextoObrigatorio('  ', 'O nome', 10)).toBe('O nome é obrigatório.');
    expect(validarTextoObrigatorio('x'.repeat(11), 'O nome', 10)).toBe('O nome deve ter no máximo 10 caracteres.');
    expect(validarTextoObrigatorio('Fiat', 'O nome', 10)).toBeUndefined();
  });

  it('valida CPF, e-mail e placa como a API', () => {
    expect(validarCpf('')).toBe('O CPF é obrigatório.');
    expect(validarCpf('123.456')).toBe('O CPF deve conter exatamente 11 dígitos numéricos.');
    expect(validarCpf('102.030.405-70')).toBeUndefined();
    expect(validarEmail('sem-arroba')).toBe('O e-mail informado não é válido.');
    expect(validarEmail('a@b.com')).toBeUndefined();
    for (const placa of ['ABC1234', 'ABC-1234', 'ABC1D23']) expect(validarPlaca(placa)).toBeUndefined();
    expect(validarPlaca('12ABC34')).toBe('A placa deve estar no formato ABC1234, ABC-1234 ou ABC1D23.');
  });

  it('valida inteiros e o valor da diária', () => {
    expect(validarInteiro('', 'O ano')).toBe('O ano é obrigatório.');
    expect(validarInteiro('20,5', 'O ano')).toBe('O ano deve ser um número inteiro.');
    expect(validarInteiro('1800', 'O ano', { min: 1900, max: 2027, mensagemFaixa: 'fora' })).toBe('fora');
    expect(validarInteiro('2023', 'O ano', { min: 1900, max: 2027 })).toBeUndefined();
    expect(validarValorDiaria('0')).toContain('maior que zero');
    expect(validarValorDiaria('119,90')).toBeUndefined();
    expect(validarValorDiaria('abc')).toBe('O valor da diária deve ser um número.');
  });
});

describe('aluguel', () => {
  it('estima o total contando cada dia iniciado com no mínimo uma diária', () => {
    expect(estimarValorTotal('2026-11-18T09:00', '2026-11-18T10:00', 100)).toEqual({ diarias: 1, total: 100 });
    expect(estimarValorTotal('2026-11-18T09:00', '2026-11-21T09:00', 100)).toEqual({ diarias: 3, total: 300 });
    expect(estimarValorTotal('2026-11-18T09:00', '2026-11-24T14:30', 129.9)).toEqual({ diarias: 7, total: 909.3 });
    expect(estimarValorTotal('', '2026-11-21T09:00', 100)).toBeNull();
    expect(estimarValorTotal('2026-11-18T09:00', '2026-11-21T09:00', 0)).toBeNull();
  });

  it('considera em aberto o que não foi devolvido', () => {
    expect(estaEmAberto('EmAndamento')).toBe(true);
    expect(estaEmAberto('Atrasado')).toBe(true);
    expect(estaEmAberto('Devolvido')).toBe(false);
  });
});
