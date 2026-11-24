import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField } from '../../components/Field';
import { FormShell } from '../../components/FormShell';
import { PaginaFormulario } from '../../components/PaginaFormulario';
import { useEnvioFormulario } from '../../hooks/useEnvioFormulario';
import { useToast } from '../../hooks/useToast';
import { clientesApi } from '../../services/clientes';
import type { Cliente } from '../../types/api';
import { mascararCpf, somenteDigitos } from '../../utils/formatters';
import { validarCpf, validarEmail, validarTextoObrigatorio } from '../../utils/validators';

export function ClienteFormPage() {
  return (
    <PaginaFormulario<Cliente | null>
      tituloPlural="Clientes"
      singular="cliente"
      rota="/clientes"
      rotuloNovo="Novo cliente"
      carregar={(id, signal) => (id === undefined ? Promise.resolve(null) : clientesApi.obter(id, signal))}
    >
      {(cliente, id) => <Formulario key={id ?? 'novo'} cliente={cliente} id={id} />}
    </PaginaFormulario>
  );
}

function Formulario({ cliente, id }: { cliente: Cliente | null; id?: number }) {
  const navigate = useNavigate();
  const { notificar } = useToast();
  const [nome, setNome] = useState(cliente?.nome ?? '');
  const [cpf, setCpf] = useState(cliente ? mascararCpf(cliente.cpf) : '');
  const [email, setEmail] = useState(cliente?.email ?? '');
  const envio = useEnvioFormulario<'nome' | 'cpf' | 'email'>();

  async function enviar() {
    const dados = { nome: nome.trim(), cpf: somenteDigitos(cpf), email: email.trim() };
    const concluiu = await envio.executar(
      {
        nome: validarTextoObrigatorio(nome, 'O nome do cliente', 120),
        cpf: validarCpf(cpf),
        email: validarEmail(email),
      },
      () => (id === undefined ? clientesApi.criar(dados) : clientesApi.atualizar(id, dados)),
    );

    if (concluiu) {
      notificar('sucesso', `Cliente “${dados.nome}” ${id === undefined ? 'cadastrado' : 'atualizado'} com sucesso.`);
      navigate('/clientes');
    }
  }

  return (
    <FormShell erros={envio.resumo} enviando={envio.enviando} cancelarPara="/clientes" onSubmit={enviar}>
      <TextField rotulo="Nome completo" obrigatorio value={nome} maxLength={120} autoComplete="off" erro={envio.erros.nome} onChange={(e) => setNome(e.target.value)} />
      <TextField
        rotulo="CPF"
        obrigatorio
        inputMode="numeric"
        placeholder="000.000.000-00"
        dica="Informe os 11 dígitos; a máscara é aplicada automaticamente."
        value={cpf}
        autoComplete="off"
        erro={envio.erros.cpf}
        onChange={(e) => setCpf(mascararCpf(e.target.value))}
      />
      <TextField
        rotulo="E-mail"
        obrigatorio
        type="email"
        value={email}
        maxLength={150}
        autoComplete="off"
        erro={envio.erros.email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </FormShell>
  );
}
