import { Button } from './Button';
import { Dialog } from './Dialog';

interface Props {
  aberto: boolean;
  titulo: string;
  mensagem: string;
  rotuloConfirmar?: string;
  ocupado?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  rotuloConfirmar = 'Excluir',
  ocupado = false,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <Dialog aberto={aberto} titulo={titulo} onFechar={ocupado ? () => undefined : onCancelar}>
      <p className="dialogo__texto">{mensagem}</p>
      <div className="dialogo__acoes">
        <Button onClick={onCancelar} disabled={ocupado}>
          Cancelar
        </Button>
        <Button variante="perigo" icone="excluir" onClick={onConfirmar} disabled={ocupado}>
          {ocupado ? 'Excluindo…' : rotuloConfirmar}
        </Button>
      </div>
    </Dialog>
  );
}
