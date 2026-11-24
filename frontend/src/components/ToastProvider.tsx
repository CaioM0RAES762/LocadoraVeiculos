import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type TomToast } from '../hooks/useToast';
import { Icone } from './Icone';

interface Item {
  id: number;
  tom: TomToast;
  mensagem: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<Item[]>([]);
  const proximoId = useRef(1);

  const remover = useCallback((id: number) => setItens((lista) => lista.filter((i) => i.id !== id)), []);

  const notificar = useCallback(
    (tom: TomToast, mensagem: string) => {
      const id = proximoId.current++;
      setItens((lista) => [...lista, { id, tom, mensagem }]);
      window.setTimeout(() => remover(id), tom === 'erro' ? 10000 : 5000);
    },
    [remover],
  );

  const valor = useMemo(() => ({ notificar }), [notificar]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts">
        {itens.map((item) => (
          <div key={item.id} className={`toast toast--${item.tom}`} role={item.tom === 'erro' ? 'alert' : 'status'}>
            <Icone nome={item.tom === 'erro' ? 'alerta' : 'ok'} />
            <p>{item.mensagem}</p>
            <button type="button" className="toast__fechar" onClick={() => remover(item.id)} aria-label="Fechar notificação">
              <Icone nome="fechar" tamanho={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
