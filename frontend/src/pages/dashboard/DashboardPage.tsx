import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ButtonLink } from '../../components/Button';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '../../components/Estados';
import { Icone, type NomeIcone } from '../../components/Icone';
import { PageHeader } from '../../components/PageHeader';
import { SituacaoBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { alugueisApi } from '../../services/alugueis';
import { categoriasApi } from '../../services/categorias';
import { clientesApi } from '../../services/clientes';
import { fabricantesApi } from '../../services/fabricantes';
import { veiculosApi } from '../../services/veiculos';
import { mensagemDeErro } from '../../utils/erros';
import { formatarDataHora } from '../../utils/formatters';

interface CartaoProps {
  rotulo: string;
  valor: number;
  to: string;
  icone: NomeIcone;
  tom?: 'padrao' | 'destaque' | 'alerta';
  detalhe?: string;
}

function Cartao({ rotulo, valor, to, icone, tom = 'padrao', detalhe }: CartaoProps) {
  return (
    <li>
      <Link to={to} className={`indicador indicador--${tom}`}>
        <span className="indicador__icone">
          <Icone nome={icone} tamanho={22} />
        </span>
        <span className="indicador__valor">{valor}</span>
        <span className="indicador__rotulo">{rotulo}</span>
        {detalhe && <span className="indicador__detalhe">{detalhe}</span>}
      </Link>
    </li>
  );
}

function Atalho({ to, children }: { to: string; children: ReactNode }) {
  return (
    <ButtonLink to={to} icone="mais">
      {children}
    </ButtonLink>
  );
}

export function DashboardPage() {
  const { data, error, loading, reload } = useAsyncData(async (signal) => {
    const [fabricantes, categorias, clientes, veiculos, disponiveis, alugueis] = await Promise.all([
      fabricantesApi.listar(undefined, signal),
      categoriasApi.listar(undefined, signal),
      clientesApi.listar(undefined, signal),
      veiculosApi.listar(undefined, signal),
      veiculosApi.listarDisponiveis(signal),
      alugueisApi.listar(undefined, signal),
    ]);
    return { fabricantes, categorias, clientes, veiculos, disponiveis, alugueis };
  }, 'painel');

  const emAndamento = data?.alugueis.filter((a) => a.situacao === 'EmAndamento').length ?? 0;
  const atrasados = data?.alugueis.filter((a) => a.situacao === 'Atrasado').length ?? 0;
  const emAberto = (data?.alugueis ?? [])
    .filter((a) => a.situacao !== 'Devolvido')
    .sort((a, b) => a.dataFimPrevista.localeCompare(b.dataFimPrevista))
    .slice(0, 6);

  return (
    <>
      <PageHeader titulo="Painel" subtitulo="Resumo da operação da locadora com dados lidos da API e do banco SQL Server." />

      <section aria-label="Atalhos de cadastro" className="atalhos">
        <h2 className="sr-only">Atalhos</h2>
        <Atalho to="/alugueis/novo">Novo aluguel</Atalho>
        <Atalho to="/clientes/novo">Novo cliente</Atalho>
        <Atalho to="/veiculos/novo">Novo veículo</Atalho>
        <Atalho to="/fabricantes/novo">Novo fabricante</Atalho>
        <Atalho to="/categorias/nova">Nova categoria</Atalho>
      </section>

      {loading && <LoadingState mensagem="Carregando indicadores…" />}
      {error && <ErrorState mensagem={mensagemDeErro(error)} onTentarNovamente={reload} />}

      {data && (
        <>
          <section aria-label="Indicadores">
            <h2 className="sr-only">Indicadores</h2>
            <ul className="indicadores">
              <Cartao rotulo="Fabricantes" valor={data.fabricantes.length} to="/fabricantes" icone="fabricante" />
              <Cartao rotulo="Categorias" valor={data.categorias.length} to="/categorias" icone="categoria" />
              <Cartao rotulo="Clientes" valor={data.clientes.length} to="/clientes" icone="cliente" />
              <Cartao rotulo="Veículos" valor={data.veiculos.length} to="/veiculos" icone="veiculo" />
              <Cartao rotulo="Veículos disponíveis" valor={data.disponiveis.length} to="/veiculos?consulta=disponiveis" icone="veiculo" tom="destaque" />
              <Cartao rotulo="Aluguéis em andamento" valor={emAndamento} to="/alugueis?situacao=EmAndamento" icone="aluguel" tom="destaque" />
              <Cartao rotulo="Aluguéis atrasados" valor={atrasados} to="/alugueis?situacao=Atrasado" icone="alerta" tom="alerta" />
            </ul>
          </section>

          <div className="painel-colunas">
            <section className="cartao" aria-labelledby="titulo-abertos">
              <h2 id="titulo-abertos">Aluguéis em aberto</h2>
              {emAberto.length === 0 ? (
                <EmptyState titulo="Nenhum aluguel em aberto" descricao="Todos os veículos alugados já foram devolvidos." />
              ) : (
                <DataTable
                  legenda="Aluguéis em aberto, ordenados pelo fim previsto"
                  linhas={emAberto}
                  chave={(a) => a.id}
                  colunas={[
                    { cabecalho: 'Cliente', celula: (a) => a.cliente },
                    { cabecalho: 'Veículo', celula: (a) => `${a.placa} · ${a.modelo}` },
                    { cabecalho: 'Fim previsto', celula: (a) => formatarDataHora(a.dataFimPrevista) },
                    { cabecalho: 'Situação', celula: (a) => <SituacaoBadge situacao={a.situacao} /> },
                  ]}
                />
              )}
              <p className="cartao__rodape">
                <Link to="/alugueis">Ver todos os aluguéis</Link>
              </p>
            </section>

            <section className="cartao" aria-labelledby="titulo-consultas">
              <h2 id="titulo-consultas">Consultas</h2>
              <ul className="lista-consultas">
                <li>
                  <Link to="/veiculos?consulta=disponiveis">Veículos disponíveis</Link>
                  <span>GET /api/Veiculos/filtro/disponiveis</span>
                </li>
                <li>
                  <Link to="/alugueis?consulta=periodo">Aluguéis por período</Link>
                  <span>GET /api/Alugueis/filtro/periodo</span>
                </li>
                <li>
                  <Link to="/alugueis?consulta=cliente">Histórico por cliente</Link>
                  <span>GET /api/Alugueis/filtro/cliente/{'{id}'}</span>
                </li>
                <li>
                  <Link to="/veiculos?consulta=fabricante">Veículos por fabricante</Link>
                  <span>GET /api/Veiculos/filtro/fabricante</span>
                </li>
                <li>
                  <Link to="/clientes?consulta=sem-alugueis">Clientes sem aluguéis</Link>
                  <span>GET /api/Clientes/filtro/sem-alugueis</span>
                </li>
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
