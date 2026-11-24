import type { ReactNode } from 'react';

export interface Coluna<T> {
  cabecalho: string;
  celula: (linha: T) => ReactNode;
  /** Alinha à direita (valores numéricos e monetários). */
  numerica?: boolean;
  /** Oculta o cabeçalho visualmente (coluna de ações). */
  acoes?: boolean;
}

interface Props<T> {
  legenda: string;
  colunas: Coluna<T>[];
  linhas: T[];
  chave: (linha: T) => string | number;
}

/**
 * Tabela acessível e responsiva: em telas estreitas cada linha vira um cartão e as células
 * exibem o cabeçalho via `data-label`.
 */
export function DataTable<T>({ legenda, colunas, linhas, chave }: Props<T>) {
  return (
    <div className="tabela-wrap" role="region" aria-label={legenda} tabIndex={0}>
      <table className="tabela">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr>
            {colunas.map((c) => (
              <th key={c.cabecalho} scope="col" className={c.numerica ? 'num' : undefined}>
                {c.acoes ? <span className="sr-only">{c.cabecalho}</span> : c.cabecalho}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={chave(linha)}>
              {colunas.map((c) => (
                <td
                  key={c.cabecalho}
                  data-label={c.acoes ? undefined : c.cabecalho}
                  className={[c.numerica ? 'num' : '', c.acoes ? 'acoes' : ''].filter(Boolean).join(' ') || undefined}
                >
                  {c.acoes ? <div className="acoes-grupo">{c.celula(linha)}</div> : c.celula(linha)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
