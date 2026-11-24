import { ListaCadastroSimples } from '../../components/cadastro-simples/ListaCadastroSimples';
import { configFabricantes } from './config';

export function FabricantesListPage() {
  return <ListaCadastroSimples config={configFabricantes} />;
}
