const CAMINHOS = {
  painel: 'M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z',
  fabricante: 'M3 21h18M5 21V10l5 3V10l5 3V4h4v17',
  categoria: 'M3 12V4h8l10 10-8 8zM7.5 8.5h.01',
  cliente: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  veiculo: 'M3 15l2-6a2 2 0 0 1 2-1.5h10A2 2 0 0 1 19 9l2 6v4h-3v-2H6v2H3zM7 14h.01M17 14h.01',
  aluguel: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  menu: 'M4 6h16M4 12h16M4 18h16',
  mais: 'M12 5v14M5 12h14',
  editar: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  excluir: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  buscar: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  devolver: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  fechar: 'M6 6l12 12M18 6L6 18',
  alerta: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  ok: 'M5 13l4 4L19 7',
  historico: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2',
} as const;

export type NomeIcone = keyof typeof CAMINHOS;

interface Props {
  nome: NomeIcone;
  tamanho?: number;
}

/** Ícones de traço desenhados para este projeto (24x24). São decorativos: o texto do botão/link os descreve. */
export function Icone({ nome, tamanho = 18 }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  );
}
