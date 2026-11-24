import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export interface ItemTrilha {
  rotulo: string;
  to?: string;
}

interface Props {
  titulo: string;
  subtitulo?: string;
  trilha?: ItemTrilha[];
  acoes?: ReactNode;
}

export function PageHeader({ titulo, subtitulo, trilha, acoes }: Props) {
  useDocumentTitle(titulo);

  return (
    <header className="pagina-cabecalho">
      <div>
        {trilha && trilha.length > 0 && (
          <nav aria-label="Você está em" className="trilha">
            <ol>
              {trilha.map((item, indice) => (
                <li key={item.rotulo}>
                  {item.to && indice < trilha.length - 1 ? (
                    <Link to={item.to}>{item.rotulo}</Link>
                  ) : (
                    <span aria-current={indice === trilha.length - 1 ? 'page' : undefined}>{item.rotulo}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1>{titulo}</h1>
        {subtitulo && <p className="pagina-cabecalho__subtitulo">{subtitulo}</p>}
      </div>
      {acoes && <div className="pagina-cabecalho__acoes">{acoes}</div>}
    </header>
  );
}
