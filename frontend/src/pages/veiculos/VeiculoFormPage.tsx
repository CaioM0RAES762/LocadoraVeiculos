import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SelectField, TextField } from '../../components/Field';
import { FormShell } from '../../components/FormShell';
import { PaginaFormulario } from '../../components/PaginaFormulario';
import { useEnvioFormulario } from '../../hooks/useEnvioFormulario';
import { useToast } from '../../hooks/useToast';
import { categoriasApi } from '../../services/categorias';
import { fabricantesApi } from '../../services/fabricantes';
import { veiculosApi } from '../../services/veiculos';
import type { Categoria, Fabricante, Veiculo } from '../../types/api';
import { validarInteiro, validarPlaca, validarSelecao, validarTextoObrigatorio } from '../../utils/validators';

interface Dados {
  fabricantes: Fabricante[];
  categorias: Categoria[];
  veiculo: Veiculo | null;
}

export function VeiculoFormPage() {
  return (
    <PaginaFormulario<Dados>
      tituloPlural="Veículos"
      singular="veículo"
      rota="/veiculos"
      rotuloNovo="Novo veículo"
      carregar={async (id, signal) => {
        const [fabricantes, categorias, veiculo] = await Promise.all([
          fabricantesApi.listar(undefined, signal),
          categoriasApi.listar(undefined, signal),
          id === undefined ? Promise.resolve(null) : veiculosApi.obter(id, signal),
        ]);
        return { fabricantes, categorias, veiculo };
      }}
    >
      {(dados, id) => <Formulario key={id ?? 'novo'} dados={dados} id={id} />}
    </PaginaFormulario>
  );
}

type Campo = 'placa' | 'modelo' | 'anoFabricacao' | 'quilometragem' | 'fabricanteId' | 'categoriaId';

function Formulario({ dados, id }: { dados: Dados; id?: number }) {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const { veiculo } = dados;
  const [placa, setPlaca] = useState(veiculo?.placa ?? '');
  const [modelo, setModelo] = useState(veiculo?.modelo ?? '');
  const [ano, setAno] = useState(veiculo ? String(veiculo.anoFabricacao) : '');
  const [km, setKm] = useState(veiculo ? String(veiculo.quilometragem) : '0');
  const [fabricanteId, setFabricanteId] = useState(veiculo ? String(veiculo.fabricanteId) : '');
  const [categoriaId, setCategoriaId] = useState(veiculo ? String(veiculo.categoriaId) : '');
  const envio = useEnvioFormulario<Campo>();

  const anoMaximo = new Date().getFullYear() + 1;

  async function enviar() {
    const corpo = {
      placa: placa.trim().toUpperCase(),
      modelo: modelo.trim(),
      anoFabricacao: Number(ano),
      quilometragem: Number(km),
      fabricanteId: Number(fabricanteId),
      categoriaId: Number(categoriaId),
    };

    const concluiu = await envio.executar(
      {
        placa: validarPlaca(placa),
        modelo: validarTextoObrigatorio(modelo, 'O modelo', 100),
        anoFabricacao: validarInteiro(ano, 'O ano de fabricação', {
          min: 1900,
          max: anoMaximo,
          mensagemFaixa: `O ano de fabricação deve estar entre 1900 e ${anoMaximo}.`,
        }),
        quilometragem: validarInteiro(km, 'A quilometragem', { min: 0, mensagemFaixa: 'A quilometragem não pode ser negativa.' }),
        fabricanteId: validarSelecao(fabricanteId, 'um fabricante'),
        categoriaId: validarSelecao(categoriaId, 'uma categoria'),
      },
      () => (id === undefined ? veiculosApi.criar(corpo) : veiculosApi.atualizar(id, corpo)),
    );

    if (concluiu) {
      notificar('sucesso', `Veículo ${corpo.placa} ${id === undefined ? 'cadastrado' : 'atualizado'} com sucesso.`);
      navigate('/veiculos');
    }
  }

  return (
    <FormShell erros={envio.resumo} enviando={envio.enviando} cancelarPara="/veiculos" onSubmit={enviar}>
      <div className="grade-campos">
        <TextField
          rotulo="Placa"
          obrigatorio
          value={placa}
          maxLength={8}
          autoComplete="off"
          dica="Formatos aceitos: ABC1234, ABC-1234 ou ABC1D23."
          erro={envio.erros.placa}
          onChange={(e) => setPlaca(e.target.value.toUpperCase())}
        />
        <TextField rotulo="Modelo" obrigatorio value={modelo} maxLength={100} autoComplete="off" erro={envio.erros.modelo} onChange={(e) => setModelo(e.target.value)} />
        <TextField
          rotulo="Ano de fabricação"
          obrigatorio
          type="number"
          inputMode="numeric"
          min={1900}
          max={anoMaximo}
          value={ano}
          erro={envio.erros.anoFabricacao}
          onChange={(e) => setAno(e.target.value)}
        />
        <TextField
          rotulo="Quilometragem (km)"
          obrigatorio
          type="number"
          inputMode="numeric"
          min={0}
          value={km}
          erro={envio.erros.quilometragem}
          onChange={(e) => setKm(e.target.value)}
        />
        <SelectField
          rotulo="Fabricante"
          obrigatorio
          placeholder="Selecione o fabricante"
          opcoes={dados.fabricantes.map((f) => ({ valor: String(f.id), rotulo: f.nome }))}
          value={fabricanteId}
          erro={envio.erros.fabricanteId}
          onChange={(e) => setFabricanteId(e.target.value)}
        />
        <SelectField
          rotulo="Categoria"
          obrigatorio
          placeholder="Selecione a categoria"
          opcoes={dados.categorias.map((c) => ({ valor: String(c.id), rotulo: c.nome }))}
          value={categoriaId}
          erro={envio.erros.categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        />
      </div>
      {(dados.fabricantes.length === 0 || dados.categorias.length === 0) && (
        <p className="aviso-formulario">
          {dados.fabricantes.length === 0 && (
            <>
              Nenhum fabricante cadastrado. <Link to="/fabricantes/novo">Cadastre um fabricante</Link>.{' '}
            </>
          )}
          {dados.categorias.length === 0 && (
            <>
              Nenhuma categoria cadastrada. <Link to="/categorias/nova">Cadastre uma categoria</Link>.
            </>
          )}
        </p>
      )}
    </FormShell>
  );
}
