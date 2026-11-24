import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAsyncData } from '../hooks/useAsyncData';
import { mensagemDeErro } from '../utils/erros';
import { ErrorState, LoadingState } from './Estados';
import { PageHeader } from './PageHeader';

interface Props<D> {
  tituloPlural: string;
  singular: string;
  rota: string;
  rotuloNovo: string;
  /** Carrega o registro (quando há id) e as listas auxiliares do formulário. */
  carregar: (id: number | undefined, signal: AbortSignal) => Promise<D>;
  children: (dados: D, id: number | undefined) => ReactNode;
}

/** Moldura das telas de cadastro/edição: lê o :id da rota, carrega os dados e trata carregamento e erros. */
export function PaginaFormulario<D>({ tituloPlural, singular, rota, rotuloNovo, carregar, children }: Props<D>) {
  const { id } = useParams();
  const idNumero = id === undefined ? undefined : Number(id);
  const editando = idNumero !== undefined;
  const idInvalido = editando && (!Number.isInteger(idNumero) || idNumero < 1);

  // Para um id inválido nada é consultado; a mensagem de erro abaixo substitui o formulário.
  const dados = useAsyncData<D>(
    (signal) => (idInvalido ? Promise.resolve(undefined as D) : carregar(idNumero, signal)),
    `${idNumero ?? 'novo'}`,
  );

  const titulo = editando ? `Editar ${singular}` : rotuloNovo;
  const trilha = [
    { rotulo: 'Painel', to: '/' },
    { rotulo: tituloPlural, to: rota },
    { rotulo: editando ? 'Editar' : 'Novo cadastro' },
  ];

  const mensagemErro = idInvalido ? 'O código informado na URL é inválido.' : dados.error ? mensagemDeErro(dados.error) : null;

  return (
    <>
      <PageHeader titulo={titulo} trilha={trilha} subtitulo={mensagemErro ? undefined : 'Os campos marcados com * são obrigatórios.'} />
      <section className="cartao cartao--formulario">
        {mensagemErro ? (
          <>
            <ErrorState mensagem={mensagemErro} />
            <p className="estado__link">
              <Link to={rota}>Voltar para {tituloPlural.toLowerCase()}</Link>
            </p>
          </>
        ) : dados.loading ? (
          <LoadingState />
        ) : (
          children(dados.data as D, idNumero)
        )}
      </section>
    </>
  );
}
