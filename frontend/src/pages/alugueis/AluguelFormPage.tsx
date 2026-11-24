import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { SelectField, TextField } from '../../components/Field';
import { FormShell } from '../../components/FormShell';
import { PaginaFormulario } from '../../components/PaginaFormulario';
import { useEnvioFormulario } from '../../hooks/useEnvioFormulario';
import { useToast } from '../../hooks/useToast';
import { alugueisApi } from '../../services/alugueis';
import { clientesApi } from '../../services/clientes';
import { veiculosApi } from '../../services/veiculos';
import type { Aluguel, Cliente, Veiculo } from '../../types/api';
import { estimarValorTotal } from '../../utils/aluguel';
import { agoraComoCampo, amanhaComoCampo, deCampoDataHora, formatarMoeda, formatarQuilometragem, paraCampoDataHora } from '../../utils/formatters';
import { validarInteiro, validarSelecao, validarValorDiaria } from '../../utils/validators';

interface Dados {
  clientes: Cliente[];
  veiculos: Veiculo[];
  aluguel: Aluguel | null;
}

export function AluguelFormPage() {
  return (
    <PaginaFormulario<Dados>
      tituloPlural="Aluguéis"
      singular="aluguel"
      rota="/alugueis"
      rotuloNovo="Novo aluguel"
      carregar={async (id, signal) => {
        // Em um novo aluguel só são oferecidos veículos disponíveis (rota /filtro/disponiveis);
        // ao editar, todos os veículos, pois o veículo do próprio aluguel consta como "em locação".
        const [clientes, veiculos, aluguel] = await Promise.all([
          clientesApi.listar(undefined, signal),
          id === undefined ? veiculosApi.listarDisponiveis(signal) : veiculosApi.listar(undefined, signal),
          id === undefined ? Promise.resolve(null) : alugueisApi.obter(id, signal),
        ]);
        return { clientes, veiculos, aluguel };
      }}
    >
      {(dados, id) => <Formulario key={id ?? 'novo'} dados={dados} id={id} />}
    </PaginaFormulario>
  );
}

type Campo =
  | 'clienteId'
  | 'veiculoId'
  | 'dataInicio'
  | 'dataFimPrevista'
  | 'dataDevolucao'
  | 'quilometragemInicial'
  | 'quilometragemFinal'
  | 'valorDiaria';

function Formulario({ dados, id }: { dados: Dados; id?: number }) {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const [parametros] = useSearchParams();
  const { aluguel } = dados;
  const novo = id === undefined;

  const veiculoInicial = aluguel ? String(aluguel.veiculoId) : (parametros.get('veiculoId') ?? '');
  const kmDoVeiculoInicial = dados.veiculos.find((v) => String(v.id) === veiculoInicial)?.quilometragem;

  const [clienteId, setClienteId] = useState(aluguel ? String(aluguel.clienteId) : (parametros.get('clienteId') ?? ''));
  const [veiculoId, setVeiculoId] = useState(veiculoInicial);
  const [inicio, setInicio] = useState(aluguel ? paraCampoDataHora(aluguel.dataInicio) : agoraComoCampo());
  const [fimPrevisto, setFimPrevisto] = useState(aluguel ? paraCampoDataHora(aluguel.dataFimPrevista) : amanhaComoCampo());
  const [devolucao, setDevolucao] = useState(aluguel ? paraCampoDataHora(aluguel.dataDevolucao) : '');
  const [kmInicial, setKmInicial] = useState(aluguel ? String(aluguel.quilometragemInicial) : kmDoVeiculoInicial !== undefined ? String(kmDoVeiculoInicial) : '');
  const [kmFinal, setKmFinal] = useState(aluguel?.quilometragemFinal != null ? String(aluguel.quilometragemFinal) : '');
  const [diaria, setDiaria] = useState(aluguel ? String(aluguel.valorDiaria) : '');
  const envio = useEnvioFormulario<Campo>();

  const veiculoSelecionado = dados.veiculos.find((v) => String(v.id) === veiculoId);
  const valorDiaria = Number(diaria.replace(',', '.'));
  const estimativa = estimarValorTotal(inicio, devolucao, valorDiaria);

  function escolherVeiculo(valor: string) {
    setVeiculoId(valor);
    // Em um novo aluguel, a quilometragem inicial acompanha a quilometragem atual do veículo.
    const escolhido = dados.veiculos.find((v) => String(v.id) === valor);
    if (novo && escolhido) setKmInicial(String(escolhido.quilometragem));
  }

  function validar(): Partial<Record<Campo, string | undefined>> {
    const temDevolucao = devolucao !== '';
    const temKmFinal = kmFinal.trim() !== '';

    const erroKmInicial = validarInteiro(kmInicial, 'A quilometragem inicial', { min: 0, mensagemFaixa: 'A quilometragem inicial não pode ser negativa.' });
    let erroKmFinal: string | undefined;
    if (temDevolucao && !temKmFinal) erroKmFinal = 'Informe a quilometragem final ao registrar a devolução.';
    else if (!temDevolucao && temKmFinal) erroKmFinal = 'A quilometragem final só pode ser informada junto com a data de devolução.';
    else if (temKmFinal) {
      erroKmFinal =
        validarInteiro(kmFinal, 'A quilometragem final', { min: 0, mensagemFaixa: 'A quilometragem final não pode ser negativa.' }) ??
        (!erroKmInicial && Number(kmFinal) < Number(kmInicial) ? 'A quilometragem final não pode ser inferior à quilometragem inicial.' : undefined);
    }

    return {
      clienteId: validarSelecao(clienteId, 'um cliente'),
      veiculoId: validarSelecao(veiculoId, 'um veículo'),
      dataInicio: inicio ? undefined : 'A data de início é obrigatória.',
      dataFimPrevista: !fimPrevisto
        ? 'A data de fim prevista é obrigatória.'
        : inicio && fimPrevisto <= inicio
          ? 'A data de fim prevista deve ser posterior à data de início.'
          : undefined,
      dataDevolucao: temDevolucao && inicio && devolucao < inicio ? 'A data de devolução não pode ser anterior à data de início.' : undefined,
      quilometragemInicial: erroKmInicial,
      quilometragemFinal: erroKmFinal,
      valorDiaria: validarValorDiaria(diaria),
    };
  }

  async function enviar() {
    const corpo = {
      clienteId: Number(clienteId),
      veiculoId: Number(veiculoId),
      dataInicio: deCampoDataHora(inicio) ?? '',
      dataFimPrevista: deCampoDataHora(fimPrevisto) ?? '',
      dataDevolucao: deCampoDataHora(devolucao),
      quilometragemInicial: Number(kmInicial),
      quilometragemFinal: kmFinal.trim() === '' ? null : Number(kmFinal),
      valorDiaria,
    };

    const resultado: { criado: Aluguel | null } = { criado: null };
    const concluiu = await envio.executar(validar(), async () => {
      if (id === undefined) resultado.criado = await alugueisApi.criar(corpo);
      else await alugueisApi.atualizar(id, corpo);
    });

    if (concluiu) {
      notificar(
        'sucesso',
        id === undefined
          ? `Aluguel #${resultado.criado?.id ?? ''} registrado com sucesso.`
          : `Aluguel #${id} atualizado com sucesso.`,
      );
      navigate('/alugueis');
    }
  }

  return (
    <FormShell erros={envio.resumo} enviando={envio.enviando} cancelarPara="/alugueis" onSubmit={enviar}>
      <fieldset className="grupo">
        <legend>Locação</legend>
        <div className="grade-campos">
          <SelectField
            rotulo="Cliente"
            obrigatorio
            placeholder="Selecione o cliente"
            opcoes={dados.clientes.map((c) => ({ valor: String(c.id), rotulo: c.nome }))}
            value={clienteId}
            erro={envio.erros.clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          />
          <SelectField
            rotulo="Veículo"
            obrigatorio
            placeholder={novo ? 'Selecione um veículo disponível' : 'Selecione o veículo'}
            opcoes={dados.veiculos.map((v) => ({
              valor: String(v.id),
              rotulo: `${v.placa} · ${v.fabricante} ${v.modelo}${!novo && !v.disponivel && String(v.id) !== veiculoInicial ? ' (em locação)' : ''}`,
            }))}
            value={veiculoId}
            erro={envio.erros.veiculoId}
            dica={veiculoSelecionado ? `Quilometragem atual do veículo: ${formatarQuilometragem(veiculoSelecionado.quilometragem)}` : undefined}
            onChange={(e) => escolherVeiculo(e.target.value)}
          />
          <TextField rotulo="Início" obrigatorio type="datetime-local" value={inicio} erro={envio.erros.dataInicio} onChange={(e) => setInicio(e.target.value)} />
          <TextField
            rotulo="Fim previsto"
            obrigatorio
            type="datetime-local"
            value={fimPrevisto}
            erro={envio.erros.dataFimPrevista}
            onChange={(e) => setFimPrevisto(e.target.value)}
          />
          <TextField
            rotulo="Quilometragem inicial (km)"
            obrigatorio
            type="number"
            inputMode="numeric"
            min={0}
            value={kmInicial}
            erro={envio.erros.quilometragemInicial}
            onChange={(e) => setKmInicial(e.target.value)}
          />
          <TextField
            rotulo="Valor da diária (R$)"
            obrigatorio
            type="number"
            inputMode="decimal"
            min={0.01}
            step="0.01"
            value={diaria}
            erro={envio.erros.valorDiaria}
            onChange={(e) => setDiaria(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="grupo">
        <legend>Devolução (opcional)</legend>
        <p className="grupo__dica">Preencha a data e a quilometragem final apenas quando o veículo já tiver sido devolvido.</p>
        <div className="grade-campos">
          <TextField
            rotulo="Data e hora da devolução"
            type="datetime-local"
            value={devolucao}
            erro={envio.erros.dataDevolucao}
            onChange={(e) => setDevolucao(e.target.value)}
          />
          <TextField
            rotulo="Quilometragem final (km)"
            type="number"
            inputMode="numeric"
            min={0}
            value={kmFinal}
            erro={envio.erros.quilometragemFinal}
            onChange={(e) => setKmFinal(e.target.value)}
          />
        </div>

        {aluguel && (
          <p className="total-api">
            Valor total registrado pela API: <strong>{formatarMoeda(aluguel.valorTotal)}</strong>
          </p>
        )}
        {estimativa && (
          <p className="estimativa" aria-live="polite">
            <strong>Estimativa:</strong> {estimativa.diarias} {estimativa.diarias === 1 ? 'diária' : 'diárias'} × {formatarMoeda(valorDiaria)} ={' '}
            {formatarMoeda(estimativa.total)}. O valor oficial é calculado pela API ao salvar.
          </p>
        )}
      </fieldset>

      {dados.clientes.length === 0 && (
        <p className="aviso-formulario">
          Nenhum cliente cadastrado. <Link to="/clientes/novo">Cadastre um cliente</Link>.
        </p>
      )}
      {novo && dados.veiculos.length === 0 && (
        <p className="aviso-formulario">
          Nenhum veículo disponível para locação no momento. <Link to="/veiculos/novo">Cadastre um veículo</Link> ou registre uma devolução.
        </p>
      )}
    </FormShell>
  );
}
