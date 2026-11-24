import { Button, ButtonLink } from '../../components/Button';
import { DataTable, type Coluna } from '../../components/DataTable';
import { SituacaoBadge } from '../../components/StatusBadge';
import type { Aluguel, AluguelDoCliente, AluguelPeriodo, SituacaoAluguel } from '../../types/api';
import { estaEmAberto } from '../../utils/aluguel';
import { formatarDataHora, formatarMoeda } from '../../utils/formatters';

/** Formato comum para exibir as três respostas de aluguéis (listagem, período e histórico por cliente). */
export interface LinhaAluguel {
  id: number;
  cliente?: string;
  veiculo: string;
  dataInicio: string;
  dataFimPrevista: string;
  dataDevolucao: string | null;
  valorDiaria: number;
  valorTotal: number | null;
  situacao: SituacaoAluguel;
}

export function deAluguel(a: Aluguel | AluguelPeriodo): LinhaAluguel {
  return {
    id: a.id,
    cliente: a.cliente,
    veiculo: `${a.placa} · ${a.modelo}`,
    dataInicio: a.dataInicio,
    dataFimPrevista: a.dataFimPrevista,
    dataDevolucao: a.dataDevolucao,
    valorDiaria: a.valorDiaria,
    valorTotal: a.valorTotal,
    situacao: a.situacao,
  };
}

export function doHistoricoDoCliente(a: AluguelDoCliente): LinhaAluguel {
  return {
    id: a.id,
    veiculo: `${a.placa} · ${a.fabricante} ${a.modelo}`,
    dataInicio: a.dataInicio,
    dataFimPrevista: a.dataFimPrevista,
    dataDevolucao: a.dataDevolucao,
    valorDiaria: a.valorDiaria,
    valorTotal: a.valorTotal,
    situacao: a.situacao,
  };
}

interface Props {
  linhas: LinhaAluguel[];
  legenda: string;
  mostrarCliente: boolean;
  onDevolver: (linha: LinhaAluguel) => void;
  onExcluir: (linha: LinhaAluguel) => void;
}

export function AluguelTable({ linhas, legenda, mostrarCliente, onDevolver, onExcluir }: Props) {
  const colunas: Coluna<LinhaAluguel>[] = [
    ...(mostrarCliente ? [{ cabecalho: 'Cliente', celula: (l: LinhaAluguel) => l.cliente }] : []),
    { cabecalho: 'Veículo', celula: (l) => l.veiculo },
    {
      cabecalho: 'Período',
      celula: (l) => (
        <span className="periodo">
          <span>
            <span className="periodo__rotulo">Início</span> {formatarDataHora(l.dataInicio)}
          </span>
          <span>
            <span className="periodo__rotulo">Previsto</span> {formatarDataHora(l.dataFimPrevista)}
          </span>
          {l.dataDevolucao && (
            <span>
              <span className="periodo__rotulo">Devolução</span> {formatarDataHora(l.dataDevolucao)}
            </span>
          )}
        </span>
      ),
    },
    { cabecalho: 'Diária', celula: (l) => formatarMoeda(l.valorDiaria), numerica: true },
    { cabecalho: 'Total (API)', celula: (l) => formatarMoeda(l.valorTotal), numerica: true },
    { cabecalho: 'Situação', celula: (l) => <SituacaoBadge situacao={l.situacao} /> },
    {
      cabecalho: 'Ações',
      acoes: true,
      celula: (l) => (
        <>
          {estaEmAberto(l.situacao) && (
            <Button pequeno variante="primario" icone="devolver" aria-label={`Registrar devolução do aluguel ${l.id}`} onClick={() => onDevolver(l)}>
              Devolver
            </Button>
          )}
          <ButtonLink to={`/alugueis/${l.id}/editar`} pequeno icone="editar" aria-label={`Editar aluguel ${l.id}`}>
            Editar
          </ButtonLink>
          <Button pequeno variante="perigo" icone="excluir" aria-label={`Excluir aluguel ${l.id}`} onClick={() => onExcluir(l)}>
            Excluir
          </Button>
        </>
      ),
    },
  ];

  return <DataTable legenda={legenda} colunas={colunas} linhas={linhas} chave={(l) => l.id} />;
}
