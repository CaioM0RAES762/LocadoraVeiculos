import { Button, ButtonLink } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ConsultaInfo, ConsultaTabs } from '../../components/ConsultaTabs';
import { DataTable } from '../../components/DataTable';
import { EmptyState, ErrorState, LoadingState } from '../../components/Estados';
import { SelectField, TextField } from '../../components/Field';
import { FilterBar } from '../../components/FilterBar';
import { PageHeader } from '../../components/PageHeader';
import { DisponibilidadeBadge } from '../../components/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useExclusao } from '../../hooks/useExclusao';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { categoriasApi } from '../../services/categorias';
import { fabricantesApi } from '../../services/fabricantes';
import { rotasVeiculos, veiculosApi } from '../../services/veiculos';
import type { Veiculo } from '../../types/api';
import { mensagemDeErro } from '../../utils/erros';
import { formatarQuilometragem } from '../../utils/formatters';

const CHAVES = ['placa', 'modelo', 'fabricanteId', 'categoriaId', 'disponivel', 'nome'] as const;

const CONSULTAS = [
  { id: 'todos', rotulo: 'Todos os veículos' },
  { id: 'disponiveis', rotulo: 'Disponíveis' },
  { id: 'fabricante', rotulo: 'Por fabricante' },
];

export function VeiculosListPage() {
  const filtros = useFiltrosUrl(CHAVES);
  const { consulta, aplicados } = filtros;

  const opcoes = useAsyncData(
    (signal) => Promise.all([fabricantesApi.listar(undefined, signal), categoriasApi.listar(undefined, signal)]),
    'opcoes-filtro',
  );

  const chaveConsulta = JSON.stringify([consulta, aplicados]);
  const { data, error, loading, reload } = useAsyncData<Veiculo[] | null>((signal) => {
    if (consulta === 'disponiveis') return veiculosApi.listarDisponiveis(signal);
    if (consulta === 'fabricante') {
      return aplicados.nome.trim() ? veiculosApi.listarPorFabricante(aplicados.nome, signal) : Promise.resolve(null);
    }
    return veiculosApi.listar(
      {
        placa: aplicados.placa,
        modelo: aplicados.modelo,
        fabricanteId: aplicados.fabricanteId,
        categoriaId: aplicados.categoriaId,
        disponivel: aplicados.disponivel,
      },
      signal,
    );
  }, chaveConsulta);

  const exclusao = useExclusao<Veiculo>({
    excluir: veiculosApi.excluir,
    aoExcluir: reload,
    mensagemSucesso: (alvo) => `Veículo ${alvo.placa} (${alvo.fabricante} ${alvo.modelo}) excluído com sucesso.`,
  });

  const botaoNovo = (
    <ButtonLink to="/veiculos/novo" variante="primario" icone="mais">
      Novo veículo
    </ButtonLink>
  );

  const rota =
    consulta === 'disponiveis'
      ? rotasVeiculos.disponiveis()
      : consulta === 'fabricante'
        ? rotasVeiculos.porFabricante(aplicados.nome)
        : rotasVeiculos.listar({
            placa: aplicados.placa,
            modelo: aplicados.modelo,
            fabricanteId: aplicados.fabricanteId,
            categoriaId: aplicados.categoriaId,
            disponivel: aplicados.disponivel,
          });

  const sempreComFiltros = consulta === 'todos' && filtros.temFiltros;

  return (
    <>
      <PageHeader
        titulo="Veículos"
        subtitulo="Frota da locadora. Um veículo com aluguéis vinculados não pode ser excluído."
        trilha={[{ rotulo: 'Painel', to: '/' }, { rotulo: 'Veículos' }]}
        acoes={botaoNovo}
      />

      <ConsultaTabs rotulo="Tipo de consulta de veículos" itens={CONSULTAS} ativo={consulta} onSelecionar={filtros.selecionarConsulta} />

      {consulta === 'todos' && (
        <FilterBar rotulo="Filtrar veículos" onFiltrar={filtros.aplicar} onLimpar={filtros.limpar}>
          <TextField rotulo="Placa" value={filtros.rascunho.placa} onChange={(e) => filtros.definir('placa', e.target.value.toUpperCase())} />
          <TextField rotulo="Modelo" type="search" value={filtros.rascunho.modelo} onChange={(e) => filtros.definir('modelo', e.target.value)} />
          <SelectField
            rotulo="Fabricante"
            placeholder="Todos"
            opcoes={(opcoes.data?.[0] ?? []).map((f) => ({ valor: String(f.id), rotulo: f.nome }))}
            value={filtros.rascunho.fabricanteId}
            onChange={(e) => filtros.definir('fabricanteId', e.target.value)}
          />
          <SelectField
            rotulo="Categoria"
            placeholder="Todas"
            opcoes={(opcoes.data?.[1] ?? []).map((c) => ({ valor: String(c.id), rotulo: c.nome }))}
            value={filtros.rascunho.categoriaId}
            onChange={(e) => filtros.definir('categoriaId', e.target.value)}
          />
          <SelectField
            rotulo="Disponibilidade"
            placeholder="Todos"
            opcoes={[
              { valor: 'true', rotulo: 'Disponíveis' },
              { valor: 'false', rotulo: 'Em locação' },
            ]}
            value={filtros.rascunho.disponivel}
            onChange={(e) => filtros.definir('disponivel', e.target.value)}
          />
        </FilterBar>
      )}

      {consulta === 'disponiveis' && (
        <p className="consulta-explicacao">
          Veículos sem aluguel em aberto, ou seja, prontos para locação (consulta com <strong>LEFT JOIN</strong> entre Veículos e Aluguéis sem
          devolução).
        </p>
      )}

      {consulta === 'fabricante' && (
        <>
          <p className="consulta-explicacao">
            Veículos cujo fabricante contém o texto informado (consulta com <strong>INNER JOIN</strong> entre Veículos, Fabricantes e Categorias).
          </p>
          <FilterBar rotulo="Consultar por fabricante" rotuloFiltrar="Consultar" onFiltrar={filtros.aplicar} onLimpar={filtros.limpar}>
            <TextField
              rotulo="Nome do fabricante"
              type="search"
              obrigatorio
              value={filtros.rascunho.nome}
              onChange={(e) => filtros.definir('nome', e.target.value)}
            />
          </FilterBar>
        </>
      )}

      <section aria-label="Resultados da consulta" className="cartao">
        {(consulta !== 'fabricante' || aplicados.nome.trim() !== '') && <ConsultaInfo rota={rota} total={data?.length} />}
        {loading && <LoadingState mensagem="Carregando veículos…" />}
        {error && <ErrorState mensagem={mensagemDeErro(error)} onTentarNovamente={reload} />}
        {data === null && <EmptyState titulo="Informe o nome do fabricante" descricao="Digite parte do nome, por exemplo “Fiat”, e clique em Consultar." />}
        {data && data.length === 0 && (
          <EmptyState
            titulo={
              consulta === 'disponiveis'
                ? 'Nenhum veículo disponível'
                : consulta === 'fabricante' || sempreComFiltros
                  ? 'Nenhum veículo encontrado'
                  : 'Nenhum veículo cadastrado'
            }
            descricao={
              consulta === 'disponiveis'
                ? 'Todos os veículos estão atualmente alugados.'
                : consulta === 'fabricante' || sempreComFiltros
                  ? 'Ajuste ou limpe os filtros para ver outros resultados.'
                  : 'Cadastre um veículo para começar.'
            }
            acao={sempreComFiltros ? <Button onClick={filtros.limpar}>Limpar filtros</Button> : consulta === 'todos' ? botaoNovo : undefined}
          />
        )}
        {data && data.length > 0 && (
          <DataTable
            legenda="Lista de veículos"
            linhas={data}
            chave={(linha) => linha.id}
            colunas={[
              { cabecalho: 'Placa', celula: (v) => <strong>{v.placa}</strong> },
              { cabecalho: 'Veículo', celula: (v) => `${v.fabricante} ${v.modelo}` },
              { cabecalho: 'Ano', celula: (v) => v.anoFabricacao, numerica: true },
              { cabecalho: 'Quilometragem', celula: (v) => formatarQuilometragem(v.quilometragem), numerica: true },
              { cabecalho: 'Categoria', celula: (v) => v.categoria },
              { cabecalho: 'Situação', celula: (v) => <DisponibilidadeBadge disponivel={v.disponivel} /> },
              {
                cabecalho: 'Ações',
                acoes: true,
                celula: (v) => (
                  <>
                    {v.disponivel && (
                      <ButtonLink to={`/alugueis/novo?veiculoId=${v.id}`} pequeno variante="primario" icone="aluguel" aria-label={`Alugar veículo ${v.placa}`}>
                        Alugar
                      </ButtonLink>
                    )}
                    <ButtonLink to={`/veiculos/${v.id}/editar`} pequeno icone="editar" aria-label={`Editar veículo ${v.placa}`}>
                      Editar
                    </ButtonLink>
                    <Button pequeno variante="perigo" icone="excluir" aria-label={`Excluir veículo ${v.placa}`} onClick={() => exclusao.solicitar(v)}>
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
        titulo="Excluir veículo?"
        mensagem={`Deseja realmente excluir o veículo ${exclusao.alvo?.placa ?? ''} (${exclusao.alvo?.fabricante ?? ''} ${exclusao.alvo?.modelo ?? ''})? Esta ação não pode ser desfeita.`}
        ocupado={exclusao.ocupado}
        onConfirmar={exclusao.confirmar}
        onCancelar={exclusao.cancelar}
      />
    </>
  );
}
