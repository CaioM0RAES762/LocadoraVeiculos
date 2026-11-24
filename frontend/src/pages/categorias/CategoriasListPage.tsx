import { ListaCadastroSimples } from '../../components/cadastro-simples/ListaCadastroSimples';
import { configCategorias } from './config';

export function CategoriasListPage() {
  return <ListaCadastroSimples config={configCategorias} />;
}
