import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

interface PropsDoControle {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
  'aria-required'?: true;
}

interface FieldProps {
  rotulo: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  children: (props: PropsDoControle) => ReactNode;
}

/** Associa rótulo, dica e mensagem de erro ao controle por meio de id/aria-describedby. */
export function Field({ rotulo, erro, dica, obrigatorio, children }: FieldProps) {
  const id = useId();
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descricao = [idDica, idErro].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`campo${erro ? ' campo--erro' : ''}`}>
      <label htmlFor={id}>
        {rotulo}
        {obrigatorio && (
          <span className="campo__obrigatorio" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': erro ? true : undefined,
        'aria-describedby': descricao,
        'aria-required': obrigatorio ? true : undefined,
      })}
      {dica && (
        <p id={idDica} className="campo__dica">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="campo__mensagem-erro">
          {erro}
        </p>
      )}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  rotulo: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
}

export function TextField({ rotulo, erro, dica, obrigatorio, ...input }: TextFieldProps) {
  return (
    <Field rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio}>
      {(props) => <input {...props} {...input} />}
    </Field>
  );
}

export interface OpcaoSelect {
  valor: string;
  rotulo: string;
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> {
  rotulo: string;
  opcoes: OpcaoSelect[];
  placeholder: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
}

export function SelectField({ rotulo, opcoes, placeholder, erro, dica, obrigatorio, ...select }: SelectFieldProps) {
  return (
    <Field rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio}>
      {(props) => (
        <select {...props} {...select}>
          <option value="">{placeholder}</option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
