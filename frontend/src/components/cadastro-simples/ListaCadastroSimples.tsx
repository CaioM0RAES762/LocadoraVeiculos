import { ButtonLink, Button } from '../Button';
import { ConfirmDialog } from '../ConfirmDialog';
import { DataTable } from '../DataTable';
import { EmptyState, ErrorState, LoadingState } from '../Estados';
import { FilterBar } from '../FilterBar';
import { PageHeader } from '../PageHeader';
import { TextField } from '../Field';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useExclusao } from '../../hooks/useExclusao';
import { useFiltrosUrl } from '../../hooks/useFiltrosUrl';
import { mensagemDeErro } from '../../utils/erros';
import type { ConfigCadastroSimples, RegistroSimples } from './config';

const CHAVES = ['id', 'nome'] as const;

/** Listagem com filtros (código e nome), edição e exclusão para as entidades que só possuem "nome". */
export function ListaCadastroSimples<T extends RegistroSimples>({ config }: { config: ConfigCadastroSimples<T> }) {
  const filtros = useFiltrosUrl(CHAVES);
  const { data, error, loading, reload } = useAsyncData(
    (signal) => config.api.listar(filtros.aplicados, signal),
    JSON.stringify(filtros.aplicados),
  );

  const exclusao = useExclusao<T>({
    excluir: config.api.excluir,
    aoExcluir: reload,
    mensagemSucesso: (alvo) => `${config.substantivo} “${alvo.nome}” ${config.excluido} com sucesso.`,
  });

  const botaoNovo = (
    <ButtonLink to={`${config.rota}/${config.segmentoNovo}`} variante="primario" icone="mais">
      {config.rotuloNovo}
    </ButtonLink>
  );

  return (
    <>
      <PageHeader
        titulo={config.tituloPlural}
        subtitulo={config.descricao}
        trilha={[{ rotulo: 'Painel', to: '/' }, { rotulo: config.tituloPlural }]}
        acoes={botaoNovo}
      />

      <FilterBar rotulo={`Filtrar ${config.tituloPlural.toLowerCase()}`} onFiltrar={filtros.aplicar} onLimpar={filtros.limpar}>
        <TextField
          rotulo="Código"
          type="number"
          min={1}
          inputMode="numeric"
          value={filtros.rascunho.id}
          onChange={(e) => filtros.definir('id', e.target.value)}
        />
        <TextField
          rotulo="Nome"
          type="search"
          value={filtros.rascunho.nome}
          onChange={(e) => filtros.definir('nome', e.target.value)}
        />
      </FilterBar>

      <section aria-label="Resultados da consulta" className="cartao">
        {loading && <LoadingState mensagem={`Carregando ${config.tituloPlural.toLowerCase()}…`} />}
        {error && <ErrorState mensagem={mensagemDeErro(error)} onTentarNovamente={reload} />}
        {data && data.length === 0 && (
          <EmptyState
            titulo={filtros.temFiltros ? `Nenhum ${config.singular} encontrado` : `Nenhum ${config.singular} cadastrado`}
            descricao={
              filtros.temFiltros
                ? 'Ajuste ou limpe os filtros para ver outros resultados.'
                : `Cadastre ${config.artigoIndefinido} ${config.singular} para começar.`
            }
            acao={filtros.temFiltros ? <Button onClick={filtros.limpar}>Limpar filtros</Button> : botaoNovo}
          />
        )}
        {data && data.length > 0 && (
          <>
            <p className="contagem">
              {data.length} {data.length === 1 ? 'registro' : 'registros'}
            </p>
            <DataTable
              legenda={`Lista de ${config.tituloPlural.toLowerCase()}`}
              linhas={data}
              chave={(linha) => linha.id}
              colunas={[
                { cabecalho: 'Código', celula: (linha) => linha.id, numerica: true },
                { cabecalho: 'Nome', celula: (linha) => linha.nome },
                {
                  cabecalho: 'Ações',
                  acoes: true,
                  celula: (linha) => (
                    <>
                      <ButtonLink
                        to={`${config.rota}/${linha.id}/editar`}
                        pequeno
                        icone="editar"
                        aria-label={`Editar ${config.singular} ${linha.nome}`}
                      >
                        Editar
                      </ButtonLink>
                      <Button
                        pequeno
                        variante="perigo"
                        icone="excluir"
                        aria-label={`Excluir ${config.singular} ${linha.nome}`}
                        onClick={() => exclusao.solicitar(linha)}
                      >
                        Excluir
                      </Button>
                    </>
                  ),
                },
              ]}
            />
          </>
        )}
      </section>

      <ConfirmDialog
        aberto={exclusao.alvo !== null}
        titulo={`Excluir ${config.singular}?`}
        mensagem={`Deseja realmente excluir ${config.artigoDefinido} ${config.singular} “${exclusao.alvo?.nome ?? ''}”? Esta ação não pode ser desfeita.`}
        ocupado={exclusao.ocupado}
        onConfirmar={exclusao.confirmar}
        onCancelar={exclusao.cancelar}
      />
    </>
  );
}
