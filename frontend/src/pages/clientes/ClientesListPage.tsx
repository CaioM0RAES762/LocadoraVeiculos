import { Button, ButtonLink } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ConsultaInfo, ConsultaTabs } from '../../components/ConsultaTabs';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '../../components/Estados';
import { TextField } from '../../components/Field';
import { FilterBar } from '../../components/FilterBar';
import { PageHeader } from '../../components/PageHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useExclusao } from '../../hooks/useExclusao';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { clientesApi, rotasClientes } from '../../services/clientes';
import type { Cliente } from '../../types/api';
import { mensagemDeErro } from '../../utils/erros';
import { formatarCpf, mascararCpf } from '../../utils/formatters';

const CHAVES = ['nome', 'cpf', 'email'] as const;

const CONSULTAS = [
  { id: 'todos', rotulo: 'Todos os clientes' },
  { id: 'sem-alugueis', rotulo: 'Sem aluguéis' },
];

export function ClientesListPage() {
  const filtros = useFiltrosUrl(CHAVES);
  const semAlugueis = filtros.consulta === 'sem-alugueis';

  const { data, error, loading, reload } = useAsyncData(
    (signal) => (semAlugueis ? clientesApi.listarSemAlugueis(signal) : clientesApi.listar(filtros.aplicados, signal)),
    semAlugueis ? 'sem-alugueis' : JSON.stringify(filtros.aplicados),
  );

  const exclusao = useExclusao<Cliente>({
    excluir: clientesApi.excluir,
    aoExcluir: reload,
    mensagemSucesso: (alvo) => `Cliente “${alvo.nome}” excluído com sucesso.`,
  });

  const botaoNovo = (
    <ButtonLink to="/clientes/novo" variante="primario" icone="mais">
      Novo cliente
    </ButtonLink>
  );

  const rota = semAlugueis ? rotasClientes.semAlugueis() : rotasClientes.listar(filtros.aplicados);

  return (
    <>
      <PageHeader
        titulo="Clientes"
        subtitulo="Pessoas que alugam veículos. Um cliente com aluguéis vinculados não pode ser excluído."
        trilha={[{ rotulo: 'Painel', to: '/' }, { rotulo: 'Clientes' }]}
        acoes={botaoNovo}
      />

      <ConsultaTabs rotulo="Tipo de consulta de clientes" itens={CONSULTAS} ativo={filtros.consulta} onSelecionar={filtros.selecionarConsulta} />

      {semAlugueis ? (
        <p className="consulta-explicacao">
          Clientes que nunca realizaram um aluguel (consulta com <strong>LEFT JOIN</strong> entre Clientes e Aluguéis).
        </p>
      ) : (
        <FilterBar rotulo="Filtrar clientes" onFiltrar={filtros.aplicar} onLimpar={filtros.limpar}>
          <TextField rotulo="Nome" type="search" value={filtros.rascunho.nome} onChange={(e) => filtros.definir('nome', e.target.value)} />
          <TextField
            rotulo="CPF"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={filtros.rascunho.cpf}
            onChange={(e) => filtros.definir('cpf', mascararCpf(e.target.value))}
          />
          <TextField rotulo="E-mail" type="search" value={filtros.rascunho.email} onChange={(e) => filtros.definir('email', e.target.value)} />
        </FilterBar>
      )}

      <section aria-label="Lista de clientes" className="cartao">
        <ConsultaInfo rota={rota} total={data?.length} />
        {loading && <LoadingState mensagem="Carregando clientes…" />}
        {error && <ErrorState mensagem={mensagemDeErro(error)} onTentarNovamente={reload} />}
        {data && data.length === 0 && (
          <EmptyState
            titulo={semAlugueis ? 'Todos os clientes já alugaram' : filtros.temFiltros ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            descricao={
              semAlugueis
                ? 'Não há clientes sem aluguéis no momento.'
                : filtros.temFiltros
                  ? 'Ajuste ou limpe os filtros para ver outros resultados.'
                  : 'Cadastre um cliente para começar.'
            }
            acao={!semAlugueis && filtros.temFiltros ? <Button onClick={filtros.limpar}>Limpar filtros</Button> : !semAlugueis ? botaoNovo : undefined}
          />
        )}
        {data && data.length > 0 && (
          <DataTable
            legenda="Lista de clientes"
            linhas={data}
            chave={(linha) => linha.id}
            colunas={[
              { cabecalho: 'Nome', celula: (c) => c.nome },
              { cabecalho: 'CPF', celula: (c) => formatarCpf(c.cpf) },
              { cabecalho: 'E-mail', celula: (c) => c.email },
              {
                cabecalho: 'Ações',
                acoes: true,
                celula: (c) => (
                  <>
                    {semAlugueis && (
                      <ButtonLink to={`/alugueis/novo?clienteId=${c.id}`} pequeno variante="primario" icone="aluguel" aria-label={`Novo aluguel para ${c.nome}`}>
                        Alugar
                      </ButtonLink>
                    )}
                    <ButtonLink to={`/alugueis?consulta=cliente&clienteId=${c.id}`} pequeno icone="historico" aria-label={`Ver histórico de aluguéis de ${c.nome}`}>
                      Histórico
                    </ButtonLink>
                    <ButtonLink to={`/clientes/${c.id}/editar`} pequeno icone="editar" aria-label={`Editar cliente ${c.nome}`}>
                      Editar
                    </ButtonLink>
                    <Button pequeno variante="perigo" icone="excluir" aria-label={`Excluir cliente ${c.nome}`} onClick={() => exclusao.solicitar(c)}>
                      Excluir
                    </Button>
                  </>
                ),
              },
            ]}
          />
        )}
      </section>

      <ConfirmDialog
        aberto={exclusao.alvo !== null}
        titulo="Excluir cliente?"
        mensagem={`Deseja realmente excluir o cliente “${exclusao.alvo?.nome ?? ''}”? Esta ação não pode ser desfeita.`}
        ocupado={exclusao.ocupado}
        onConfirmar={exclusao.confirmar}
        onCancelar={exclusao.cancelar}
      />
    </>
  );
}
