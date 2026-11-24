import { categoriasApi } from '../../services/categorias';
import type { ConfigCadastroSimples } from '../../components/cadastro-simples/config';
import type { Categoria } from '../../types/api';

export const configCategorias: ConfigCadastroSimples<Categoria> = {
  rota: '/categorias',
  segmentoNovo: 'nova',
  tituloPlural: 'Categorias',
  singular: 'categoria',
  substantivo: 'Categoria',
  artigoDefinido: 'a',
  artigoIndefinido: 'uma',
  rotuloNovo: 'Nova categoria',
  excluido: 'excluída',
  cadastrado: 'cadastrada',
  atualizado: 'atualizada',
  descricao: 'Classes de veículos (econômico, SUV, sedã...). Uma categoria com veículos vinculados não pode ser excluída.',
  maxNome: 80,
  api: categoriasApi,
};
