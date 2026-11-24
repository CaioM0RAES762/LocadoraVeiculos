import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icone, type NomeIcone } from './Icone';

interface ItemMenu {
  to: string;
  rotulo: string;
  icone: NomeIcone;
  end?: boolean;
}

const MENU: ItemMenu[] = [
  { to: '/', rotulo: 'Painel', icone: 'painel', end: true },
  { to: '/alugueis', rotulo: 'Aluguéis', icone: 'aluguel' },
  { to: '/veiculos', rotulo: 'Veículos', icone: 'veiculo' },
  { to: '/clientes', rotulo: 'Clientes', icone: 'cliente' },
  { to: '/fabricantes', rotulo: 'Fabricantes', icone: 'fabricante' },
  { to: '/categorias', rotulo: 'Categorias', icone: 'categoria' },
];

export function Layout() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();
  const principal = useRef<HTMLElement>(null);
  const caminhoAnterior = useRef(pathname);

  // Ao trocar de tela, move o foco para a área principal (leitores de tela anunciam a nova página).
  useEffect(() => {
    if (caminhoAnterior.current === pathname) return;
    caminhoAnterior.current = pathname;
    principal.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="app">
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="barra-topo">
        <button
          type="button"
          className="barra-topo__menu"
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          onClick={() => setMenuAberto((aberto) => !aberto)}
        >
          <Icone nome={menuAberto ? 'fechar' : 'menu'} tamanho={22} />
          <span className="sr-only">{menuAberto ? 'Fechar menu' : 'Abrir menu'}</span>
        </button>
        <span className="marca marca--topo">Locadora de Veículos</span>
      </header>

      <aside id="menu-principal" className={`lateral${menuAberto ? ' lateral--aberta' : ''}`}>
        <div className="marca">
          <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <rect width="64" height="64" rx="14" fill="#f2994a" />
            <path
              d="M12 38l4.6-11.2A5 5 0 0 1 21.2 24h21.6a5 5 0 0 1 4.6 2.8L52 38v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2H20v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2z"
              fill="#0b2f38"
            />
            <path d="M19.4 28.2L16.8 35h30.4l-2.6-6.8a1 1 0 0 0-.9-.7H20.3a1 1 0 0 0-.9.7z" fill="#f2994a" />
          </svg>
          <span>
            Locadora
            <small>de Veículos</small>
          </span>
        </div>

        <nav aria-label="Principal">
          <ul className="menu">
            {MENU.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} onClick={() => setMenuAberto(false)}>
                  <Icone nome={item.icone} />
                  {item.rotulo}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <p className="lateral__rodape">Trabalho Prático 2 · Front-end integrado à API e ao SQL Server</p>
      </aside>

      <main id="conteudo" className="principal" ref={principal} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
