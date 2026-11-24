import { fabricantesApi } from '../../services/fabricantes';
import type { ConfigCadastroSimples } from '../../components/cadastro-simples/config';
import type { Fabricante } from '../../types/api';

export const configFabricantes: ConfigCadastroSimples<Fabricante> = {
  rota: '/fabricantes',
  segmentoNovo: 'novo',
  tituloPlural: 'Fabricantes',
  singular: 'fabricante',
  substantivo: 'Fabricante',
  artigoDefinido: 'o',
  artigoIndefinido: 'um',
  rotuloNovo: 'Novo fabricante',
  excluido: 'excluído',
  cadastrado: 'cadastrado',
  atualizado: 'atualizado',
  descricao: 'Marcas dos veículos da frota. Um fabricante com veículos vinculados não pode ser excluído.',
  maxNome: 100,
  api: fabricantesApi,
};
