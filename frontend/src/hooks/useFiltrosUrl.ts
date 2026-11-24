import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export type Valores<K extends string> = Record<K, string>;

/**
 * Mantém filtros e tipo de consulta na URL (?consulta=...&nome=...), de modo que recarregar a página,
 * voltar no histórico ou compartilhar o link preserve exatamente a mesma consulta.
 *
 * - `aplicados`: valores presentes na URL (usados nas chamadas à API);
 * - `rascunho`: valores digitados nos campos, ainda não aplicados;
 * - `aplicar`/`limpar`: gravam ou removem os filtros na URL, preservando o tipo de consulta.
 */
export function useFiltrosUrl<K extends string>(chaves: readonly K[], consultaPadrao = 'todos') {
  const [params, setParams] = useSearchParams();

  const aplicados = Object.fromEntries(chaves.map((chave) => [chave, params.get(chave) ?? ''])) as Valores<K>;
  const origem = chaves.map((chave) => params.get(chave) ?? '').join('\u0000');
  const consulta = params.get('consulta') ?? consultaPadrao;

  const [estado, setEstado] = useState({ origem, valores: aplicados });
  // Se a URL mudou (voltar, link, trocar de aba), o rascunho antigo é descartado.
  const rascunho = estado.origem === origem ? estado.valores : aplicados;

  function definir(chave: K, valor: string) {
    setEstado({ origem, valores: { ...rascunho, [chave]: valor } });
  }

  function gravar(valores: Valores<K>, consultaAtual: string) {
    const proximos = new URLSearchParams();
    if (consultaAtual !== consultaPadrao) proximos.set('consulta', consultaAtual);
    for (const chave of chaves) {
      const valor = valores[chave].trim();
      if (valor) proximos.set(chave, valor);
    }
    setParams(proximos);
  }

  const vazios = Object.fromEntries(chaves.map((chave) => [chave, ''])) as Valores<K>;

  return {
    aplicados,
    rascunho,
    consulta,
    temFiltros: chaves.some((chave) => aplicados[chave] !== ''),
    definir,
    aplicar: () => gravar(rascunho, consulta),
    limpar: () => gravar(vazios, consulta),
    selecionarConsulta: (id: string) => gravar(vazios, id),
    /** Aplica valores definidos pelo código (ex.: seleção que já deve consultar). */
    aplicarValores: (valores: Partial<Valores<K>>) => gravar({ ...vazios, ...valores }, consulta),
  };
}
