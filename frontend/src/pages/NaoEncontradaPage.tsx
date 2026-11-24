import { ButtonLink } from '../components/Button';
import { PageHeader } from '../components/PageHeader';

export function NaoEncontradaPage() {
  return (
    <>
      <PageHeader titulo="Página não encontrada" />
      <section className="cartao estado">
        <p>O endereço acessado não existe neste sistema.</p>
        <ButtonLink to="/" variante="primario">
          Voltar ao painel
        </ButtonLink>
      </section>
    </>
  );
}
