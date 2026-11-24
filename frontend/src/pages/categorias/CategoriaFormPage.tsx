import { FormCadastroSimples } from '../../components/cadastro-simples/FormCadastroSimples';
import { configCategorias } from './config';

export function CategoriaFormPage() {
  return <FormCadastroSimples config={configCategorias} />;
}
