import { createContext, useContext } from 'react';

export type TomToast = 'sucesso' | 'erro' | 'info';

export interface ToastContexto {
  notificar: (tom: TomToast, mensagem: string) => void;
}

export const ToastContext = createContext<ToastContexto | null>(null);

export function useToast(): ToastContexto {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast deve ser usado dentro de <ToastProvider>.');
  return contexto;
}
