import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Icone, type NomeIcone } from './Icone';

export type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'fantasma';

interface ComunsProps {
  variante?: VarianteBotao;
  icone?: NomeIcone;
  pequeno?: boolean;
  children: ReactNode;
}

function classes(variante: VarianteBotao, pequeno?: boolean): string {
  return `botao botao--${variante}${pequeno ? ' botao--pequeno' : ''}`;
}

export function Button({
  variante = 'secundario',
  icone,
  pequeno,
  children,
  type = 'button',
  ...resto
}: ComunsProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={classes(variante, pequeno)} {...resto}>
      {icone && <Icone nome={icone} />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variante = 'secundario',
  icone,
  pequeno,
  children,
  ...resto
}: ComunsProps & Omit<LinkProps, 'className'>) {
  return (
    <Link className={classes(variante, pequeno)} {...resto}>
      {icone && <Icone nome={icone} />}
      {children}
    </Link>
  );
}
