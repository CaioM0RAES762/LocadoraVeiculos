export interface ItemConsulta {
  id: string;
  rotulo: string;
}

interface Props {
  rotulo: string;
  itens: ItemConsulta[];
  ativo: string;
  onSelecionar: (id: string) => void;
}

/** Seletor do tipo de consulta (filtros combinados ou uma das consultas SQL com rota própria). */
export function ConsultaTabs({ rotulo, itens, ativo, onSelecionar }: Props) {
  return (
    <nav aria-label={rotulo}>
      <ul className="abas">
        {itens.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={`abas__item${item.id === ativo ? ' abas__item--ativa' : ''}`}
              aria-current={item.id === ativo ? 'true' : undefined}
              onClick={() => onSelecionar(item.id)}
            >
              {item.rotulo}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface InfoProps {
  rota: string;
  total?: number;
  descricao?: string;
}

/** Mostra qual rota da API (e portanto qual consulta ao banco) originou o resultado exibido. */
export function ConsultaInfo({ rota, total, descricao }: InfoProps) {
  return (
    <div className="consulta-info">
      <p>
        <span className="consulta-info__metodo">GET</span> <code>{rota}</code>
        {total !== undefined && (
          <span className="consulta-info__total" aria-live="polite">
            {total} {total === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </p>
      {descricao && <p className="consulta-info__descricao">{descricao}</p>}
    </div>
  );
}
