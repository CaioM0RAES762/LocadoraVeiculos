import { useState } from 'react';
import { Button, ButtonLink } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ConsultaInfo, ConsultaTabs } from '../../components/ConsultaTabs';
import { EmptyState, ErrorState, LoadingState } from '../../components/Estados';
import { SelectField, TextField } from '../../components/Field';
import { FilterBar } from '../../components/FilterBar';
import { PageHeader } from '../../components/PageHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useExclusao } from '../../hooks/useExclusao';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { alugueisApi, rotasAlugueis } from '../../services/alugueis';
import { clientesApi } from '../../services/clientes';
import { veiculosApi } from '../../services/veiculos';
import { SITUACOES } from '../../utils/aluguel';
import { mensagemDeErro } from '../../utils/erros';
import { formatarData } from '../../utils/formatters';
import { AluguelTable, deAluguel, doHistoricoDoCliente, type LinhaAluguel } from './AluguelTable';
import { DevolucaoDialog } from './DevolucaoDialog';

const CHAVES = ['clienteId', 'veiculoId', 'situacao', 'inicio', 'fim'] as const;

const CONSULTAS = [
  { id: 'todos', rotulo: 'Todos os aluguéis' },
  { id: 'periodo', rotulo: 'Por período' },
  { id: 'cliente', rotulo: 'Histórico por cliente' },
];

export function AlugueisListPage() {
  const filtros = useFiltrosUrl(CHAVES);
  const { consulta, aplicados } = filtros;
  const [devolvendo, setDevolvendo] = useState<number | null>(null);

  const opcoes = useAsyncData(
    (signal) => Promise.all([clientesApi.listar(undefined, signal), veiculosApi.listar(undefined, signal)]),
    'opcoes-filtro',
  );

  const { data, error, loading, reload } = useAsyncData<LinhaAluguel[] | null>(async (signal) => {
    if (consulta === 'periodo') {
      if (!aplicados.inicio || !aplicados.fim) return null;
      return (await alugueisApi.listarPorPeriodo(aplicados.inicio, aplicados.fim, signal)).map(deAluguel);
    }

    if (consulta === 'cliente') {
      if (!aplicados.clienteId) return null;
      return (await alugueisApi.listarPorCliente(Number(aplicados.clienteId), signal)).map(doHistoricoDoCliente);
    }

    return (await alugueisApi.listar(aplicados, signal)).map(deAluguel);
  }, JSON.stringify([consulta, aplicados]));

  const exclusao = useExclusao<LinhaAluguel>({
    excluir: alugueisApi.excluir,
    aoExcluir: reload,
    mensagemSucesso: (alvo) => `Aluguel #${alvo.id} (${alvo.veiculo}) excluído com sucesso.`,
  });

  const botaoNovo = (
    <ButtonLink to="/alugueis/novo" variante="primario" icone="mais">
      Novo aluguel
    </ButtonLink>
  );

  const rota =
    consulta === 'periodo'
      ? rotasAlugueis.porPeriodo(aplicados.inicio, aplicados.fim)
      : consulta === 'cliente'
        ? rotasAlugueis.porCliente(Number(aplicados.clienteId))
        : rotasAlugueis.listar(aplicados);

  const aguardandoParametros = (consulta === 'periodo' && (!aplicados.inicio || !aplicados.fim)) || (consulta === 'cliente' && !aplicados.clienteId);
  const clientes = (opcoes.data?.[0] ?? []).map((c) => ({ valor: String(c.id), rotulo: c.nome }));
  const veiculos = (opcoes.data?.[1] ?? []).map((v) => ({ valor: String(v.id), rotulo: `${v.placa} · ${v.fabricante} ${v.modelo}` }));
  const nomeCliente = clientes.find((c) => c.valor === aplicados.clienteId)?.rotulo;

  return (
    <>
      <PageHeader
        titulo="Aluguéis"
        subtitulo="Locações de veículos, devoluções e histórico. O valor total é calculado pela API na devolução."
        trilha={[{ rotulo: 'Painel', to: '/' }, { rotulo: 'Aluguéis' }]}
        acoes={botaoNovo}
      />

      <ConsultaTabs rotulo="Tipo de consulta de aluguéis" itens={CONSULTAS} ativo={consulta} onSelecionar={filtros.selecionarConsulta} />

      {consulta === 'todos' && (
        <FilterBar rotulo="Filtrar aluguéis" onFiltrar={filtros.aplicar} onLimpar={filtros.limpar}>
          <SelectField rotulo="Cliente" placeholder="Todos" opcoes={clientes} value={filtros.rascunho.clienteId} onChange={(e) => filtros.definir('clienteId', e.target.value)} />
          <SelectField rotulo="Veículo" placeholder="Todos" opcoes={veiculos} value={filtros.rascunho.veiculoId} onChange={(e) => filtros.definir('veiculoId', e.target.value)} />
          <SelectField
            rotulo="Situação"
            placeholder="Todas"
            opcoes={SITUACOES.map((s) => ({ valor: s.valor, rotulo: s.rotulo }))}
            value={filtros.rascunho.situacao}
            onChange={(e) => filtros.definir('situacao', e.target.value)}
          />
          <TextField rotulo="Início a partir de" type="date" value={filtros.rascunho.inicio} onChange={(e) => filtros.definir('inicio', e.target.value)} />
          <TextField rotulo="Início até" type="date" value={filtros.rascunho.fim} onChange={(e) => filtros.definir('fim', e.target.value)} />
        </FilterBar>
      )}

      {consulta === 'periodo' && (
        <>
          <p className="consulta-explicacao">
            Aluguéis iniciados dentro do período, do mais antigo ao mais recente (consulta com <strong>INNER JOIN</strong> entre Aluguéis, Clientes e
            Veículos).
          </p>
          <FilterBar rotulo="Consultar aluguéis por período" rotuloFiltrar="Consultar" onFiltrar={filtros.aplicar} onLimpar={filtros.limpar}>
            <TextField rotulo="Data inicial" type="date" obrigatorio value={filtros.rascunho.inicio} onChange={(e) => filtros.definir('inicio', e.target.value)} />
            <TextField rotulo="Data final" type="date" obrigatorio value={filtros.rascunho.fim} onChange={(e) => filtros.definir('fim', e.target.value)} />
          </FilterBar>
        </>
      )}

      {consulta === 'cliente' && (
        <>
          <p className="consulta-explicacao">
            Todos os aluguéis de um cliente, com o fabricante do veículo (consulta com <strong>INNER JOIN</strong> entre Aluguéis, Veículos e
            Fabricantes).
          </p>
          <FilterBar rotulo="Consultar histórico por cliente" rotuloFiltrar="Consultar" onFiltrar={filtros.aplicar} onLimpar={filtros.limpar}>
            <SelectField
              rotulo="Cliente"
              obrigatorio
              placeholder="Selecione o cliente"
              opcoes={clientes}
              value={filtros.rascunho.clienteId}
              onChange={(e) => filtros.definir('clienteId', e.target.value)}
            />
          </FilterBar>
        </>
      )}

      <section aria-label="Lista de aluguéis" className="cartao">
        {!aguardandoParametros && (
          <ConsultaInfo
            rota={rota}
            total={data?.length}
            descricao={
              consulta === 'periodo'
                ? `Período: ${formatarData(aplicados.inicio)} a ${formatarData(aplicados.fim)}`
                : consulta === 'cliente' && nomeCliente
                  ? `Cliente: ${nomeCliente}`
                  : undefined
            }
          />
        )}
        {loading && <LoadingState mensagem="Carregando aluguéis…" />}
        {error && <ErrorState mensagem={mensagemDeErro(error)} onTentarNovamente={reload} />}
        {data === null && (
          <EmptyState
            titulo={consulta === 'periodo' ? 'Informe o período' : 'Selecione um cliente'}
            descricao={
              consulta === 'periodo'
                ? 'Preencha a data inicial e a data final e clique em Consultar.'
                : 'Escolha o cliente para ver o histórico de aluguéis.'
            }
          />
        )}
        {data && data.length === 0 && (
          <EmptyState
            titulo={consulta === 'todos' && !filtros.temFiltros ? 'Nenhum aluguel registrado' : 'Nenhum aluguel encontrado'}
            descricao={
              consulta === 'todos' && !filtros.temFiltros
                ? 'Registre um aluguel para começar.'
                : 'Não há aluguéis para os parâmetros informados. Ajuste a consulta e tente novamente.'
            }
            acao={consulta === 'todos' && filtros.temFiltros ? <Button onClick={filtros.limpar}>Limpar filtros</Button> : consulta === 'todos' ? botaoNovo : undefined}
          />
        )}
        {data && data.length > 0 && (
          <AluguelTable
            legenda="Lista de aluguéis"
            linhas={data}
            mostrarCliente={consulta !== 'cliente'}
            onDevolver={(linha) => setDevolvendo(linha.id)}
            onExcluir={exclusao.solicitar}
          />
        )}
      </section>

      <DevolucaoDialog
        aluguelId={devolvendo}
        onFechar={() => setDevolvendo(null)}
        onConcluir={() => {
          setDevolvendo(null);
          reload();
        }}
      />

      <ConfirmDialog
        aberto={exclusao.alvo !== null}
        titulo="Excluir aluguel?"
        mensagem={`Deseja realmente excluir o aluguel #${exclusao.alvo?.id ?? ''} (${exclusao.alvo?.veiculo ?? ''})? Esta ação não pode ser desfeita.`}
        ocupado={exclusao.ocupado}
        onConfirmar={exclusao.confirmar}
        onCancelar={exclusao.cancelar}
      />
    </>
  );
}
