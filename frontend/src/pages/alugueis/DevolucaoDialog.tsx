import { useState } from 'react';
import { Button } from '../../components/Button';
import { Dialog } from '../../components/Dialog';
import { ErrorState, LoadingState } from '../../components/Estados';
import { TextField } from '../../components/Field';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useEnvioFormulario } from '../../hooks/useEnvioFormulario';
import { useToast } from '../../hooks/useToast';
import { alugueisApi } from '../../services/alugueis';
import type { Aluguel } from '../../types/api';
import { estimarValorTotal } from '../../utils/aluguel';
import { mensagemDeErro } from '../../utils/erros';
import { agoraComoCampo, deCampoDataHora, formatarDataHora, formatarMoeda, paraCampoDataHora } from '../../utils/formatters';
import { validarInteiro } from '../../utils/validators';

interface Props {
  /** Id do aluguel a devolver; `null` mantém o diálogo fechado. */
  aluguelId: number | null;
  onFechar: () => void;
  onConcluir: () => void;
}

export function DevolucaoDialog({ aluguelId, onFechar, onConcluir }: Props) {
  return (
    <Dialog aberto={aluguelId !== null} titulo="Registrar devolução" onFechar={onFechar}>
      {aluguelId !== null && <Conteudo key={aluguelId} aluguelId={aluguelId} onFechar={onFechar} onConcluir={onConcluir} />}
    </Dialog>
  );
}

function Conteudo({ aluguelId, onFechar, onConcluir }: { aluguelId: number; onFechar: () => void; onConcluir: () => void }) {
  const { data, error, loading } = useAsyncData((signal) => alugueisApi.obter(aluguelId, signal), String(aluguelId));

  if (loading) return <LoadingState mensagem="Carregando aluguel…" />;

  if (error || !data) {
    return (
      <>
        <ErrorState mensagem={mensagemDeErro(error)} />
        <div className="dialogo__acoes">
          <Button onClick={onFechar}>Fechar</Button>
        </div>
      </>
    );
  }

  return <FormularioDevolucao aluguel={data} onFechar={onFechar} onConcluir={onConcluir} />;
}

interface FormProps {
  aluguel: Aluguel;
  onFechar: () => void;
  onConcluir: () => void;
}

function FormularioDevolucao({ aluguel, onFechar, onConcluir }: FormProps) {
  const { notificar } = useToast();
  const inicio = paraCampoDataHora(aluguel.dataInicio);
  const agora = agoraComoCampo();
  const [devolucao, setDevolucao] = useState(agora > inicio ? agora : inicio);
  const [kmFinal, setKmFinal] = useState(String(aluguel.quilometragemFinal ?? aluguel.quilometragemInicial));
  const envio = useEnvioFormulario<'dataDevolucao' | 'quilometragemFinal'>();

  const estimativa = estimarValorTotal(inicio, devolucao, aluguel.valorDiaria);

  async function enviar() {
    const validacao = {
      dataDevolucao: !devolucao
        ? 'A data de devolução é obrigatória.'
        : devolucao < inicio
          ? 'A data de devolução não pode ser anterior à data de início.'
          : undefined,
      quilometragemFinal:
        validarInteiro(kmFinal, 'A quilometragem final', { min: 0 }) ??
        (Number(kmFinal) < aluguel.quilometragemInicial ? 'A quilometragem final não pode ser inferior à quilometragem inicial.' : undefined),
    };

    // A API só tem PUT completo: reenviamos os dados atuais do aluguel com a devolução preenchida.
    const resultado: { total: number | null } = { total: null };
    const concluiu = await envio.executar(validacao, async () => {
      await alugueisApi.atualizar(aluguel.id, {
        clienteId: aluguel.clienteId,
        veiculoId: aluguel.veiculoId,
        dataInicio: aluguel.dataInicio,
        dataFimPrevista: aluguel.dataFimPrevista,
        dataDevolucao: deCampoDataHora(devolucao),
        quilometragemInicial: aluguel.quilometragemInicial,
        quilometragemFinal: Number(kmFinal),
        valorDiaria: aluguel.valorDiaria,
      });

      try {
        resultado.total = (await alugueisApi.obter(aluguel.id)).valorTotal;
      } catch {
        resultado.total = null; // a devolução foi gravada; apenas não foi possível reler o total
      }
    });

    if (concluiu) {
      notificar(
        'sucesso',
        resultado.total === null
          ? `Devolução do aluguel ${aluguel.id} registrada com sucesso.`
          : `Devolução do aluguel ${aluguel.id} registrada. Valor total calculado pela API: ${formatarMoeda(resultado.total)}.`,
      );
      onConcluir();
    }
  }

  return (
    <form
      noValidate
      className="formulario"
      onSubmit={(e) => {
        e.preventDefault();
        if (!envio.enviando) void enviar();
      }}
    >
      <p className="dialogo__texto">
        Aluguel <strong>#{aluguel.id}</strong> · {aluguel.cliente} · {aluguel.placa} {aluguel.modelo}
        <br />
        Início em {formatarDataHora(aluguel.dataInicio)} · fim previsto em {formatarDataHora(aluguel.dataFimPrevista)} · diária{' '}
        {formatarMoeda(aluguel.valorDiaria)}
      </p>

      {envio.resumo.length > 0 && (
        <div className="resumo-erros" role="alert">
          <ul>
            {envio.resumo.map((mensagem) => (
              <li key={mensagem}>{mensagem}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grade-campos">
        <TextField
          rotulo="Data e hora da devolução"
          obrigatorio
          type="datetime-local"
          value={devolucao}
          min={inicio}
          erro={envio.erros.dataDevolucao}
          onChange={(e) => setDevolucao(e.target.value)}
        />
        <TextField
          rotulo="Quilometragem final (km)"
          obrigatorio
          type="number"
          inputMode="numeric"
          min={aluguel.quilometragemInicial}
          value={kmFinal}
          dica={`Quilometragem inicial: ${aluguel.quilometragemInicial} km`}
          erro={envio.erros.quilometragemFinal}
          onChange={(e) => setKmFinal(e.target.value)}
        />
      </div>

      {estimativa && (
        <p className="estimativa" aria-live="polite">
          <strong>Estimativa:</strong> {estimativa.diarias} {estimativa.diarias === 1 ? 'diária' : 'diárias'} × {formatarMoeda(aluguel.valorDiaria)} ={' '}
          {formatarMoeda(estimativa.total)}. O valor oficial é calculado pela API ao registrar a devolução.
        </p>
      )}

      <div className="dialogo__acoes">
        <Button onClick={onFechar} disabled={envio.enviando}>
          Cancelar
        </Button>
        <Button type="submit" variante="primario" icone="devolver" disabled={envio.enviando}>
          {envio.enviando ? 'Registrando…' : 'Registrar devolução'}
        </Button>
      </div>
    </form>
  );
}
