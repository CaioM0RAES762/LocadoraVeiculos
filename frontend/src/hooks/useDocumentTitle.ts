import { useEffect } from 'react';

const NOME_APP = 'Locadora de Veículos';

export function useDocumentTitle(titulo: string): void {
  useEffect(() => {
    document.title = `${titulo} · ${NOME_APP}`;
  }, [titulo]);
}
