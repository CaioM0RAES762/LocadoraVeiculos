import { FormCadastroSimples } from '../../components/cadastro-simples/FormCadastroSimples';
import { configFabricantes } from './config';

export function FabricanteFormPage() {
  return <FormCadastroSimples config={configFabricantes} />;
}
