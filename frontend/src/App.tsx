import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AluguelFormPage } from './pages/alugueis/AluguelFormPage';
import { AlugueisListPage } from './pages/alugueis/AlugueisListPage';
import { CategoriaFormPage } from './pages/categorias/CategoriaFormPage';
import { CategoriasListPage } from './pages/categorias/CategoriasListPage';
import { ClienteFormPage } from './pages/clientes/ClienteFormPage';
import { ClientesListPage } from './pages/clientes/ClientesListPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { FabricanteFormPage } from './pages/fabricantes/FabricanteFormPage';
import { FabricantesListPage } from './pages/fabricantes/FabricantesListPage';
import { NaoEncontradaPage } from './pages/NaoEncontradaPage';
import { VeiculoFormPage } from './pages/veiculos/VeiculoFormPage';
import { VeiculosListPage } from './pages/veiculos/VeiculosListPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />

        <Route path="fabricantes" element={<FabricantesListPage />} />
        <Route path="fabricantes/novo" element={<FabricanteFormPage />} />
        <Route path="fabricantes/:id/editar" element={<FabricanteFormPage />} />

        <Route path="categorias" element={<CategoriasListPage />} />
        <Route path="categorias/nova" element={<CategoriaFormPage />} />
        <Route path="categorias/:id/editar" element={<CategoriaFormPage />} />

        <Route path="clientes" element={<ClientesListPage />} />
        <Route path="clientes/novo" element={<ClienteFormPage />} />
        <Route path="clientes/:id/editar" element={<ClienteFormPage />} />

        <Route path="veiculos" element={<VeiculosListPage />} />
        <Route path="veiculos/novo" element={<VeiculoFormPage />} />
        <Route path="veiculos/:id/editar" element={<VeiculoFormPage />} />

        <Route path="alugueis" element={<AlugueisListPage />} />
        <Route path="alugueis/novo" element={<AluguelFormPage />} />
        <Route path="alugueis/:id/editar" element={<AluguelFormPage />} />

        <Route path="*" element={<NaoEncontradaPage />} />
      </Route>
    </Routes>
  );
}
