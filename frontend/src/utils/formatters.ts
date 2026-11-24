const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const inteiro = new Intl.NumberFormat('pt-BR');

export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

/** Aplica a máscara 000.000.000-00 progressivamente, limitando a 11 dígitos. */
export function mascararCpf(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11);
  const partes = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean);
  let texto = partes.join('.');
  if (d.length > 9) texto += `-${d.slice(9)}`;
  return texto;
}

/** Formata um CPF armazenado (apenas dígitos) para exibição. */
export function formatarCpf(cpf: string): string {
  return cpf.length === 11 ? mascararCpf(cpf) : cpf;
}

export function formatarMoeda(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : moeda.format(valor);
}

export function formatarQuilometragem(km: number | null | undefined): string {
  return km === null || km === undefined ? '—' : `${inteiro.format(km)} km`;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** "2026-11-24T09:00:00" -> "24/11/2026 09:00". */
export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return iso;
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()} ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** "2026-11-24" -> "24/11/2026". */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

/** Valor da API (ISO sem fuso) -> valor aceito por <input type="datetime-local">. */
export function paraCampoDataHora(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : '';
}

/** Valor de <input type="datetime-local"> -> formato enviado à API (ISO local sem fuso). */
export function deCampoDataHora(valor: string): string | null {
  return valor ? `${valor.slice(0, 16)}:00` : null;
}

/** Data/hora atual (horário local) no formato de <input type="datetime-local">. */
export function agoraComoCampo(referencia: Date = new Date()): string {
  return `${referencia.getFullYear()}-${doisDigitos(referencia.getMonth() + 1)}-${doisDigitos(referencia.getDate())}T${doisDigitos(referencia.getHours())}:${doisDigitos(referencia.getMinutes())}`;
}

/** Mesmo horário de agora, 24 horas depois (sugestão de fim previsto para um novo aluguel). */
export function amanhaComoCampo(): string {
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  return agoraComoCampo(amanha);
}
