import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useEnvioFormulario } from '../../hooks/useEnvioFormulario';
import { useToast } from '../../hooks/useToast';
import { mensagemDeErro } from '../../utils/erros';
import { validarTextoObrigatorio } from '../../utils/validators';
import { ErrorState, LoadingState } from '../Estados';
import { TextField } from '../Field';
import { FormShell } from '../FormShell';
import { PageHeader } from '../PageHeader';
import type { ConfigCadastroSimples, RegistroSimples } from './config';

/** Cadastro e edição para entidades com apenas "nome" (fabricante e categoria). */
export function FormCadastroSimples<T extends RegistroSimples>({ config }: { config: ConfigCadastroSimples<T> }) {
  const { id } = useParams();
  const idNumero = id === undefined ? undefined : Number(id);
  const editando = idNumero !== undefined;
  const idInvalido = editando && (!Number.isInteger(idNumero) || idNumero < 1);

  const registro = useAsyncData<T | null>(
    (signal) => (editando && !idInvalido ? config.api.obter(idNumero, signal) : Promise.resolve(null)),
    `${idNumero ?? 'novo'}`,
  );

  const titulo = editando ? `Editar ${config.singular}` : config.rotuloNovo;
  const trilha = [
    { rotulo: 'Painel', to: '/' },
    { rotulo: config.tituloPlural, to: config.rota },
    { rotulo: editando ? 'Editar' : 'Novo cadastro' },
  ];

  if (idInvalido || registro.error) {
    return (
      <>
        <PageHeader titulo={titulo} trilha={trilha} />
        <section className="cartao">
          <ErrorState mensagem={idInvalido ? 'O código informado na URL é inválido.' : mensagemDeErro(registro.error)} />
          <p className="estado__link">
            <Link to={config.rota}>Voltar para {config.tituloPlural.toLowerCase()}</Link>
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader titulo={titulo} trilha={trilha} subtitulo="Os campos marcados com * são obrigatórios." />
      <section className="cartao cartao--formulario">
        {editando && registro.loading ? (
          <LoadingState />
        ) : (
          <Formulario key={idNumero ?? 'novo'} config={config} idNumero={idNumero} nomeInicial={registro.data?.nome ?? ''} />
        )}
      </section>
    </>
  );
}

interface FormularioProps<T extends RegistroSimples> {
  config: ConfigCadastroSimples<T>;
  idNumero?: number;
  nomeInicial: string;
}

function Formulario<T extends RegistroSimples>({ config, idNumero, nomeInicial }: FormularioProps<T>) {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const [nome, setNome] = useState(nomeInicial);
  const envio = useEnvioFormulario<'nome'>();

  async function enviar() {
    const dados = { nome: nome.trim() };
    const concluiu = await envio.executar(
      { nome: validarTextoObrigatorio(nome, `O nome d${config.artigoDefinido} ${config.singular}`, config.maxNome) },
      () => (idNumero === undefined ? config.api.criar(dados) : config.api.atualizar(idNumero, dados)),
    );

    if (concluiu) {
      notificar('sucesso', `${config.substantivo} “${dados.nome}” ${idNumero === undefined ? config.cadastrado : config.atualizado} com sucesso.`);
      navigate(config.rota);
    }
  }

  return (
    <FormShell erros={envio.resumo} enviando={envio.enviando} cancelarPara={config.rota} onSubmit={enviar}>
      <TextField
        rotulo="Nome"
        obrigatorio
        value={nome}
        maxLength={config.maxNome}
        autoComplete="off"
        erro={envio.erros.nome}
        onChange={(e) => setNome(e.target.value)}
      />
    </FormShell>
  );
}
