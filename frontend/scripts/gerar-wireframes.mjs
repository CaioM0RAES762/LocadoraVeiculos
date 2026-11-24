/**
 * Gera os wireframes de alta fidelidade (desktop 1440 px de largura) em SVG e os exporta em PNG.
 *
 *   npm run wireframes
 *
 * Saída: docs/wireframes/svg/*.svg (editáveis e importáveis no Figma por arrastar e soltar)
 *        docs/wireframes/*.png     (imagens usadas no README e no artigo)
 *
 * Os quadros reproduzem as telas implementadas, com os mesmos rótulos, colunas e rotas da API.
 * Os dados exibidos são fictícios (os mesmos de docs/scripts/dados-demonstracao.sql).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const aqui = dirname(fileURLToPath(import.meta.url));
const destino = resolve(aqui, '../../docs/wireframes');
const destinoSvg = join(destino, 'svg');
mkdirSync(destinoSvg, { recursive: true });

const L = 1440;
const AREA = 860; // altura da "tela"; abaixo ficam as notas do quadro

const COR = {
  fundo: '#eceff1',
  superficie: '#ffffff',
  linha: '#cfd8dc',
  tinta: '#263238',
  suave: '#607d8b',
  lateral: '#37474f',
  primaria: '#0b5563',
  perigo: '#b42318',
  cabecalho: '#e3e8eb',
  destaque: '#f2994a',
  controle: '#90a4ae',
};

const TONS = {
  sucesso: ['#e8f5e9', '#2e7d32'],
  aviso: ['#fff3e0', '#9a5b00'],
  perigo: ['#ffebee', '#b42318'],
  info: ['#e3f2fd', '#0d5aa7'],
};

const FONTE = "'Segoe UI', Arial, Helvetica, sans-serif";
const MONO = "Consolas, 'Courier New', monospace";

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

class Tela {
  constructor() {
    this.p = [];
    this.nNotas = 1;
  }
  altura() {
    return AREA + 44 + this.nNotas * 24;
  }
  add(x) {
    this.p.push(x);
  }
  rect(x, y, w, h, { fill = 'none', stroke = 'none', rx = 0, sw = 1, op = 1 } = {}) {
    this.add(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${op}"/>`);
  }
  text(x, y, t, { size = 14, weight = 400, fill = COR.tinta, anchor = 'start', mono = false, upper = false } = {}) {
    const conteudo = upper ? String(t).toUpperCase() : t;
    this.add(
      `<text x="${x}" y="${y}" font-family="${mono ? MONO : FONTE}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(conteudo)}</text>`,
    );
  }
  line(x1, y1, x2, y2, { stroke = COR.linha, sw = 1, dash = '' } = {}) {
    this.add(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`);
  }
  circle(cx, cy, r, { fill = 'none', stroke = 'none', sw = 1 } = {}) {
    this.add(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`);
  }
  svg(id, titulo) {
    const alt = this.altura();
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${alt}" viewBox="0 0 ${L} ${alt}" role="img" aria-label="${esc(titulo)}">\n<title>${esc(titulo)}</title>\n${this.p.join('\n')}\n</svg>\n`;
  }
}

/* ---------- Componentes ---------- */
function botao(s, x, y, w, rotulo, tipo = 'sec', h = 40) {
  const estilos = {
    primario: { fill: COR.primaria, stroke: COR.primaria, cor: '#fff' },
    sec: { fill: '#fff', stroke: COR.controle, cor: COR.tinta },
    perigo: { fill: '#fff', stroke: COR.perigo, cor: COR.perigo },
  }[tipo];
  s.rect(x, y, w, h, { fill: estilos.fill, stroke: estilos.stroke, rx: 8 });
  s.text(x + w / 2, y + h / 2 + 5, rotulo, { size: h < 36 ? 12 : 14, weight: 600, fill: estilos.cor, anchor: 'middle' });
}

function campo(s, x, y, w, rotulo, valor = '', { seletor = false, marcador = '', obrigatorio = false, erro = '', dica = '' } = {}) {
  s.text(x, y + 12, rotulo + (obrigatorio ? ' *' : ''), { size: 13, weight: 600 });
  s.rect(x, y + 20, w, 42, { fill: '#fff', stroke: erro ? COR.perigo : COR.controle, rx: 8, sw: erro ? 2 : 1 });
  if (valor) s.text(x + 14, y + 46, valor, { size: 14 });
  else if (marcador) s.text(x + 14, y + 46, marcador, { size: 14, fill: COR.suave });
  if (seletor) s.text(x + w - 22, y + 46, '▾', { size: 14, fill: COR.suave });
  let fim = y + 62;
  if (dica) {
    s.text(x, fim + 16, dica, { size: 12, fill: COR.suave });
    fim += 20;
  }
  if (erro) {
    s.text(x, fim + 16, erro, { size: 12, weight: 600, fill: COR.perigo });
    fim += 20;
  }
  return fim;
}

function selo(s, x, y, tom, rotulo) {
  const [fundo, cor] = TONS[tom];
  const w = rotulo.length * 7.2 + 22;
  s.rect(x, y - 14, w, 22, { fill: fundo, rx: 11 });
  s.text(x + w / 2, y + 2, rotulo, { size: 12, weight: 700, fill: cor, anchor: 'middle' });
}

function cartao(s, x, y, w, h) {
  s.rect(x, y, w, h, { fill: '#fff', stroke: COR.linha, rx: 10 });
}

function abas(s, x, y, itens, ativa) {
  let cx = x;
  itens.forEach((item, i) => {
    const w = item.length * 8 + 36;
    const ativo = i === ativa;
    s.text(cx + w / 2, y + 22, item, { size: 14, weight: 600, fill: ativo ? COR.primaria : COR.suave, anchor: 'middle' });
    cx += w + 4;
  });
  s.line(x, y + 37, x + 1136, y + 37, { stroke: COR.linha, sw: 2 });
  let ax = x;
  itens.forEach((item, i) => {
    const w = item.length * 8 + 36;
    if (i === ativa) s.rect(ax, y + 35, w, 3, { fill: COR.primaria });
    ax += w + 4;
  });
  return y + 44;
}

function barraFiltros(s, x, y, w, campos, rotuloFiltrar = 'Filtrar') {
  cartao(s, x, y, w, 100);
  let cx = x + 20;
  for (const c of campos) {
    campo(s, cx, y + 14, c.w, c.rotulo, c.valor ?? '', { seletor: c.seletor, marcador: c.marcador, obrigatorio: c.obrigatorio });
    cx += c.w + 16;
  }
  botao(s, x + w - 190, y + 34, 100, rotuloFiltrar, 'primario');
  botao(s, x + w - 82, y + 34, 66, 'Limpar', 'sec');
  return y + 100;
}

function infoConsulta(s, x, y, w, rota, total, extra = '') {
  s.rect(x, y, w, extra ? 54 : 34, { fill: '#eef3f5', rx: 8 });
  s.rect(x + 10, y + 7, 36, 20, { fill: COR.primaria, rx: 4 });
  s.text(x + 28, y + 21, 'GET', { size: 11, weight: 700, fill: '#fff', anchor: 'middle' });
  s.text(x + 58, y + 22, rota, { size: 13, mono: true });
  s.text(x + w - 12, y + 22, total, { size: 13, weight: 700, fill: COR.primaria, anchor: 'end' });
  if (extra) s.text(x + 12, y + 44, extra, { size: 12, fill: COR.suave });
  return y + (extra ? 54 : 34);
}

function tabela(s, x, y, w, colunas, linhas, { alturaLinha = 56 } = {}) {
  const soma = colunas.reduce((a, c) => a + c.w, 0);
  const fator = w / soma;
  s.rect(x, y, w, 36, { fill: COR.cabecalho, rx: 6 });
  let cx = x;
  const posicoes = colunas.map((c) => {
    const largura = c.w * fator;
    const inicio = cx;
    cx += largura;
    return { ...c, x: inicio, largura };
  });
  for (const c of posicoes) {
    const tx = c.num ? c.x + c.largura - 14 : c.x + 14;
    if (c.cab !== 'Ações') s.text(tx, y + 23, c.cab, { size: 11, weight: 700, fill: COR.suave, anchor: c.num ? 'end' : 'start', upper: true });
  }
  linhas.forEach((linha, i) => {
    const ly = y + 36 + i * alturaLinha;
    s.line(x, ly + alturaLinha, x + w, ly + alturaLinha);
    linha.forEach((celula, j) => {
      const c = posicoes[j];
      const tx = c.num ? c.x + c.largura - 14 : c.x + 14;
      const base = ly + alturaLinha / 2 + 5;
      if (Array.isArray(celula)) {
        // Lista de botões pequenos alinhados à direita
        let bx = c.x + c.largura - 14;
        for (const rotulo of [...celula].reverse()) {
          const bw = rotulo.length * 7 + 28;
          bx -= bw;
          botao(s, bx, ly + (alturaLinha - 30) / 2, bw, rotulo, rotulo === 'Excluir' ? 'perigo' : rotulo === 'Alugar' || rotulo === 'Devolver' ? 'primario' : 'sec', 30);
          bx -= 8;
        }
      } else if (celula && typeof celula === 'object') {
        selo(s, c.x + 14, base - 2, celula.tom, celula.t);
      } else if (typeof celula === 'string' && celula.includes('\n')) {
        const [a, b, d] = celula.split('\n');
        s.text(tx, base - 17, a, { size: 12 });
        s.text(tx, base - 1, b, { size: 12 });
        if (d) s.text(tx, base + 15, d, { size: 12 });
      } else {
        s.text(tx, base, celula, { size: 14, anchor: c.num ? 'end' : 'start', weight: c.forte ? 700 : 400 });
      }
    });
  });
  return y + 36 + linhas.length * alturaLinha;
}

function anotar(s, n, x, y) {
  s.circle(x, y, 12, { fill: COR.destaque });
  s.text(x, y + 5, String(n), { size: 13, weight: 800, fill: COR.tinta, anchor: 'middle' });
}

function notas(s, itens) {
  s.nNotas = itens.length;
  s.rect(0, AREA, L, 44 + itens.length * 24, { fill: '#fafbfc' });
  s.line(0, AREA, L, AREA, { stroke: COR.controle });
  s.text(32, AREA + 28, 'NOTAS DA TELA', { size: 12, weight: 700, fill: COR.suave });
  itens.forEach((t, i) => {
    s.circle(42, AREA + 52 + i * 24, 9, { fill: COR.destaque });
    s.text(42, AREA + 56 + i * 24, String(i + 1), { size: 11, weight: 800, anchor: 'middle' });
    s.text(62, AREA + 57 + i * 24, t, { size: 13 });
  });
}

const MENU = ['Painel', 'Aluguéis', 'Veículos', 'Clientes', 'Fabricantes', 'Categorias'];

function moldura(titulo, { ativo, trilha, subtitulo, acao }) {
  const s = new Tela();
  s.rect(0, 0, L, 1400, { fill: '#fff' });
  s.rect(0, 0, L, AREA, { fill: COR.fundo });
  // Menu lateral
  s.rect(0, 0, 240, AREA, { fill: COR.lateral });
  s.rect(24, 26, 38, 38, { fill: COR.destaque, rx: 9 });
  s.text(74, 42, 'Locadora', { size: 17, weight: 700, fill: '#fff' });
  s.text(74, 59, 'de Veículos', { size: 12, fill: '#b0bec5' });
  MENU.forEach((m, i) => {
    const y = 100 + i * 48;
    if (i === ativo) {
      s.rect(12, y, 216, 40, { fill: COR.primaria, rx: 8 });
      s.rect(12, y, 4, 40, { fill: COR.destaque });
    }
    s.rect(32, y + 12, 16, 16, { stroke: '#cfd8dc', rx: 4, sw: 1.5 });
    s.text(62, y + 26, m, { size: 15, weight: i === ativo ? 700 : 500, fill: '#fff' });
  });
  s.text(24, AREA - 36, 'Trabalho Prático 2 · Front-end', { size: 11, fill: '#90a4ae' });
  s.text(24, AREA - 20, 'integrado à API e ao SQL Server', { size: 11, fill: '#90a4ae' });
  // Cabeçalho da página
  s.text(272, 40, trilha, { size: 13, fill: COR.suave });
  s.text(272, 76, titulo, { size: 30, weight: 700 });
  if (subtitulo) s.text(272, 100, subtitulo, { size: 14, fill: COR.suave });
  if (acao) botao(s, 1408 - (acao.length * 8 + 44), 48, acao.length * 8 + 44, `+  ${acao}`, 'primario');
  return s;
}

const X = 272;
const W = 1136;

/* ---------- Quadros ---------- */
const quadros = [];
const novo = (arquivo, titulo, montar) => quadros.push({ arquivo, titulo, montar });

novo('00-layout-navegacao', 'Layout geral e navegação', () => {
  const s = moldura('Veículos', { ativo: 2, trilha: 'Painel / Veículos', subtitulo: 'Frota da locadora. Um veículo com aluguéis vinculados não pode ser excluído.', acao: 'Novo veículo' });
  abas(s, X, 124, ['Todos os veículos', 'Disponíveis', 'Por fabricante'], 0);
  barraFiltros(s, X, 178, W, [
    { rotulo: 'Placa', w: 150 },
    { rotulo: 'Modelo', w: 170 },
    { rotulo: 'Fabricante', w: 170, seletor: true, valor: 'Todos' },
    { rotulo: 'Categoria', w: 160, seletor: true, valor: 'Todas' },
  ]);
  cartao(s, X, 298, W, 330);
  s.text(X + 30, 380, 'Área de resultados: tabela, carregando, vazio ou erro', { size: 15, fill: COR.suave });
  anotar(s, 1, 226, 122);
  anotar(s, 2, X + 520, 78);
  anotar(s, 3, 1394, 36);
  anotar(s, 4, X + 440, 140);
  anotar(s, 5, X + 6, 228);
  anotar(s, 6, X + 6, 330);
  // Versão móvel (esboço)
  const mx = 1090;
  const my = 330;
  s.rect(mx, my, 250, 280, { fill: '#fff', stroke: COR.controle, rx: 14, sw: 2 });
  s.rect(mx, my, 250, 36, { fill: COR.lateral, rx: 14 });
  s.rect(mx, my + 20, 250, 16, { fill: COR.lateral });
  s.text(mx + 16, my + 25, '≡', { size: 20, fill: '#fff' });
  s.text(mx + 48, my + 24, 'Locadora de Veículos', { size: 12, weight: 700, fill: '#fff' });
  for (const [i, t] of ['ABC1D23', 'FGH2E34'].entries()) {
    const yy = my + 52 + i * 78;
    s.rect(mx + 12, yy, 226, 68, { fill: '#fff', stroke: COR.linha, rx: 8 });
    s.text(mx + 24, yy + 22, 'PLACA', { size: 10, weight: 700, fill: COR.suave });
    s.text(mx + 226, yy + 22, t, { size: 12, weight: 700, anchor: 'end' });
    s.text(mx + 24, yy + 44, 'VEÍCULO', { size: 10, weight: 700, fill: COR.suave });
    s.text(mx + 226, yy + 44, i === 0 ? 'Fiat Mobi' : 'Fiat Argo', { size: 12, anchor: 'end' });
  }
  s.text(mx + 125, my + 214, 'Telas estreitas: menu recolhível', { size: 11, fill: COR.suave, anchor: 'middle' });
  s.text(mx + 125, my + 230, 'e tabelas em cartões', { size: 11, fill: COR.suave, anchor: 'middle' });
  notas(s, [
    'Menu lateral fixo com as cinco entidades e o painel; em telas estreitas vira um menu recolhível com botão.',
    'Trilha de navegação (breadcrumb) e título da página; o foco do teclado vai para a área principal ao trocar de tela.',
    'Ação principal da tela (cadastro). Todas as telas seguem o mesmo padrão de botões primário, secundário e de perigo.',
    'Abas escolhem o tipo de consulta: filtros combinados ou uma das consultas SQL com rota própria na API.',
    'Barra de filtros (ao menos dois campos por entidade); o estado dos filtros fica na URL e sobrevive ao recarregamento.',
    'Resultados vindos da API/SQL Server, com a rota consultada e o total de registros exibidos acima da tabela.',
  ]);
  return s;
});

novo('01-painel', 'Painel inicial', () => {
  const s = moldura('Painel', { ativo: 0, trilha: '', subtitulo: 'Resumo da operação da locadora com dados lidos da API e do banco SQL Server.' });
  ['Novo aluguel', 'Novo cliente', 'Novo veículo', 'Novo fabricante', 'Nova categoria'].reduce((cx, t) => {
    const w = t.length * 8 + 44;
    botao(s, cx, 120, w, `+  ${t}`, 'sec');
    return cx + w + 10;
  }, X);
  const cartoes = [
    ['Fabricantes', 6, COR.primaria],
    ['Categorias', 5, COR.primaria],
    ['Clientes', 9, COR.primaria],
    ['Veículos', 15, COR.primaria],
    ['Veículos disponíveis', 10, COR.destaque],
    ['Aluguéis em andamento', 3, COR.destaque],
    ['Aluguéis atrasados', 2, COR.perigo],
  ];
  cartoes.forEach(([rotulo, valor, cor], i) => {
    const cx = X + (i % 4) * 288;
    const cy = 184 + Math.floor(i / 4) * 112;
    cartao(s, cx, cy, 268, 96);
    s.rect(cx, cy, 5, 96, { fill: cor, rx: 2 });
    s.rect(cx + 20, cy + 18, 38, 38, { fill: '#e3edf0', rx: 8 });
    s.text(cx + 248, cy + 50, String(valor), { size: 34, weight: 800, anchor: 'end' });
    s.text(cx + 20, cy + 82, rotulo, { size: 14, weight: 600, fill: COR.suave });
  });
  cartao(s, X, 424, 740, 396);
  s.text(X + 24, 456, 'Aluguéis em aberto', { size: 18, weight: 700 });
  tabela(
    s,
    X + 20,
    476,
    700,
    [
      { cab: 'Cliente', w: 190 },
      { cab: 'Veículo', w: 190 },
      { cab: 'Fim previsto', w: 190 },
      { cab: 'Situação', w: 130 },
    ],
    [
      ['Rafael Tavares', 'WXY6S78 · Jetta', '20/11/2026 09:00', { tom: 'perigo', t: 'Atrasado' }],
      ['Beatriz Nogueira', 'FGH2E34 · Argo', '22/11/2026 09:00', { tom: 'perigo', t: 'Atrasado' }],
      ['Camila Furtado', 'QRS4Q56 · Duster', '26/11/2026 09:00', { tom: 'info', t: 'Em andamento' }],
      ['Otávio Resende', 'KLM2O34 · Creta', '27/11/2026 09:00', { tom: 'info', t: 'Em andamento' }],
    ],
    { alturaLinha: 52 },
  );
  s.text(X + 24, 800, 'Ver todos os aluguéis', { size: 14, weight: 700, fill: COR.primaria });
  cartao(s, X + 760, 424, 376, 396);
  s.text(X + 784, 456, 'Consultas', { size: 18, weight: 700 });
  [
    ['Veículos disponíveis', 'GET /api/Veiculos/filtro/disponiveis'],
    ['Aluguéis por período', 'GET /api/Alugueis/filtro/periodo'],
    ['Histórico por cliente', 'GET /api/Alugueis/filtro/cliente/{id}'],
    ['Veículos por fabricante', 'GET /api/Veiculos/filtro/fabricante'],
    ['Clientes sem aluguéis', 'GET /api/Clientes/filtro/sem-alugueis'],
  ].forEach(([t, r], i) => {
    s.text(X + 784, 496 + i * 58, t, { size: 15, weight: 700, fill: COR.primaria });
    s.text(X + 784, 516 + i * 58, r, { size: 12, mono: true, fill: COR.suave });
  });
  anotar(s, 1, X + 300, 140);
  anotar(s, 2, X + 1118, 176);
  anotar(s, 3, X + 720, 440);
  anotar(s, 4, X + 1118, 440);
  notas(s, [
    'Atalhos para os cadastros mais usados.',
    'Indicadores calculados com listas reais: GET /api/Fabricantes, /Categorias, /Clientes, /Veiculos, /Veiculos/filtro/disponiveis e /Alugueis.',
    'Aluguéis em aberto (em andamento e atrasados) ordenados pelo fim previsto; a situação vem da API.',
    'Atalhos para as consultas SQL que alimentam as telas de filtro.',
  ]);
  return s;
});

function listaSimples(arquivo, titulo, { entidade, plural, novoRotulo, ativo, dados, descricao }) {
  novo(arquivo, titulo, () => {
    const s = moldura(plural, { ativo, trilha: `Painel / ${plural}`, subtitulo: descricao, acao: novoRotulo });
    barraFiltros(s, X, 124, W, [
      { rotulo: 'Código', w: 160 },
      { rotulo: 'Nome', w: 360 },
    ]);
    cartao(s, X, 244, W, 90 + dados.length * 56);
    s.text(X + 20, 276, `${dados.length} registros`, { size: 13, fill: COR.suave });
    tabela(
      s,
      X + 20,
      290,
      W - 40,
      [
        { cab: 'Código', w: 140, num: true },
        { cab: 'Nome', w: 700 },
        { cab: 'Ações', w: 300 },
      ],
      dados.map(([id, nome]) => [String(id), nome, ['Editar', 'Excluir']]),
    );
    anotar(s, 1, X + 560, 138);
    anotar(s, 2, X + 6, 276);
    anotar(s, 3, X + W - 60, 330);
    notas(s, [
      `Filtros por código e nome do ${entidade} (GET com query string: ?id=&nome=).`,
      'Contagem de registros e tabela responsiva; sem resultados, aparece o estado vazio com botão para limpar os filtros.',
      'Editar abre o formulário preenchido; Excluir pede confirmação e exibe o erro 409 da API se houver vínculos.',
    ]);
    return s;
  });
}

function formularioSimples(arquivo, titulo, { plural, singular, novoRotulo, ativo, exemplo }) {
  novo(arquivo, titulo, () => {
    const s = moldura(novoRotulo, { ativo, trilha: `Painel / ${plural} / Novo cadastro`, subtitulo: 'Os campos marcados com * são obrigatórios.' });
    cartao(s, X, 124, 880, 230);
    campo(s, X + 28, 150, 480, 'Nome', exemplo, { obrigatorio: true });
    s.line(X + 28, 262, X + 852, 262);
    botao(s, X + 28, 286, 110, '✓  Salvar', 'primario');
    botao(s, X + 150, 286, 100, 'Cancelar', 'sec');
    anotar(s, 1, X + 500, 168);
    anotar(s, 2, X + 90, 310);
    notas(s, [
      `Cadastro e edição do ${singular} usam a mesma tela (POST /api/${plural} ou PUT /api/${plural}/{id}).`,
      'Salvar valida os campos (resumo de erros acessível no topo) e exibe a mensagem de sucesso ao concluir.',
    ]);
    return s;
  });
}

listaSimples('02-fabricantes-lista', 'Fabricantes — listagem', {
  entidade: 'fabricante',
  plural: 'Fabricantes',
  novoRotulo: 'Novo fabricante',
  ativo: 4,
  descricao: 'Marcas dos veículos da frota. Um fabricante com veículos vinculados não pode ser excluído.',
  dados: [[1, 'Fiat'], [2, 'Volkswagen'], [3, 'Chevrolet'], [4, 'Toyota'], [5, 'Hyundai'], [6, 'Renault']],
});
formularioSimples('03-fabricantes-formulario', 'Fabricantes — cadastro e edição', { plural: 'Fabricantes', singular: 'fabricante', novoRotulo: 'Novo fabricante', ativo: 4, exemplo: 'Honda' });
listaSimples('04-categorias-lista', 'Categorias — listagem', {
  entidade: 'categoria',
  plural: 'Categorias',
  novoRotulo: 'Nova categoria',
  ativo: 5,
  descricao: 'Classes de veículos (econômico, SUV, sedã...). Uma categoria com veículos vinculados não pode ser excluída.',
  dados: [[1, 'Econômico'], [2, 'Sedã'], [3, 'SUV'], [4, 'Utilitário'], [5, 'Premium']],
});
formularioSimples('05-categorias-formulario', 'Categorias — cadastro e edição', { plural: 'Categorias', singular: 'categoria', novoRotulo: 'Nova categoria', ativo: 5, exemplo: 'Esportivo' });

const clientes = [
  ['Mariana Albuquerque', '102.030.405-70', 'mariana.albuquerque@exemplo.test'],
  ['Rafael Tavares', '214.365.879-64', 'rafael.tavares@exemplo.test'],
  ['Beatriz Nogueira', '305.070.901-44', 'beatriz.nogueira@exemplo.test'],
  ['Henrique Matos', '418.293.645-02', 'henrique.matos@exemplo.test'],
];

novo('06-clientes-lista', 'Clientes — listagem e filtros', () => {
  const s = moldura('Clientes', { ativo: 3, trilha: 'Painel / Clientes', subtitulo: 'Pessoas que alugam veículos. Um cliente com aluguéis vinculados não pode ser excluído.', acao: 'Novo cliente' });
  abas(s, X, 120, ['Todos os clientes', 'Sem aluguéis'], 0);
  barraFiltros(s, X, 172, W, [
    { rotulo: 'Nome', w: 280 },
    { rotulo: 'CPF', w: 220, marcador: '000.000.000-00' },
    { rotulo: 'E-mail', w: 320 },
  ]);
  cartao(s, X, 292, W, 380);
  infoConsulta(s, X + 20, 310, W - 40, '/api/Clientes', '9 resultados');
  tabela(
    s,
    X + 20,
    356,
    W - 40,
    [
      { cab: 'Nome', w: 250 },
      { cab: 'CPF', w: 160 },
      { cab: 'E-mail', w: 280 },
      { cab: 'Ações', w: 380 },
    ],
    clientes.map(([n, c, e]) => [n, c, e, ['Histórico', 'Editar', 'Excluir']]),
  );
  anotar(s, 1, X + 600, 186);
  anotar(s, 2, X + 6, 328);
  anotar(s, 3, X + W - 40, 400);
  notas(s, [
    'Filtros por nome, CPF (com máscara) e e-mail: GET /api/Clientes?nome=&cpf=&email=.',
    'Rota consultada e total de clientes exibidos.',
    'Histórico leva ao histórico de aluguéis do cliente; Editar e Excluir seguem o padrão das demais entidades.',
  ]);
  return s;
});

novo('07-clientes-formulario', 'Clientes — cadastro e edição', () => {
  const s = moldura('Novo cliente', { ativo: 3, trilha: 'Painel / Clientes / Novo cadastro', subtitulo: 'Os campos marcados com * são obrigatórios.' });
  cartao(s, X, 124, 880, 420);
  campo(s, X + 28, 148, 560, 'Nome completo', 'Mariana Albuquerque', { obrigatorio: true });
  campo(s, X + 28, 232, 360, 'CPF', '102.030.405-70', { obrigatorio: true, dica: 'Informe os 11 dígitos; a máscara é aplicada automaticamente.' });
  campo(s, X + 28, 336, 560, 'E-mail', 'mariana.albuquerque@exemplo.test', { obrigatorio: true });
  s.line(X + 28, 444, X + 852, 444);
  botao(s, X + 28, 468, 110, '✓  Salvar', 'primario');
  botao(s, X + 150, 468, 100, 'Cancelar', 'sec');
  anotar(s, 1, X + 400, 262);
  anotar(s, 2, X + 600, 358);
  notas(s, [
    'O CPF é digitado com máscara e enviado à API apenas com os 11 dígitos.',
    'CPF ou e-mail duplicado: a API responde 409 e a mensagem aparece no resumo de erros do formulário.',
  ]);
  return s;
});

novo('08-clientes-sem-alugueis', 'Clientes sem aluguéis (consulta LEFT JOIN)', () => {
  const s = moldura('Clientes', { ativo: 3, trilha: 'Painel / Clientes', subtitulo: 'Pessoas que alugam veículos. Um cliente com aluguéis vinculados não pode ser excluído.', acao: 'Novo cliente' });
  abas(s, X, 120, ['Todos os clientes', 'Sem aluguéis'], 1);
  s.text(X, 188, 'Clientes que nunca realizaram um aluguel (consulta com LEFT JOIN entre Clientes e Aluguéis).', { size: 14, fill: COR.suave });
  cartao(s, X, 208, W, 250);
  infoConsulta(s, X + 20, 226, W - 40, '/api/Clientes/filtro/sem-alugueis', '2 resultados');
  tabela(
    s,
    X + 20,
    272,
    W - 40,
    [
      { cab: 'Nome', w: 250 },
      { cab: 'CPF', w: 160 },
      { cab: 'E-mail', w: 280 },
      { cab: 'Ações', w: 380 },
    ],
    [
      ['Gustavo Pimentel', '852.963.147-19', 'gustavo.pimentel@exemplo.test', ['Alugar', 'Histórico', 'Editar', 'Excluir']],
      ['Isadora Valente', '963.147.258-28', 'isadora.valente@exemplo.test', ['Alugar', 'Histórico', 'Editar', 'Excluir']],
    ],
  );
  anotar(s, 1, X + 220, 120);
  anotar(s, 2, X + 6, 244);
  anotar(s, 3, X + W - 40, 316);
  notas(s, [
    'A aba “Sem aluguéis” troca a consulta e limpa os filtros; o tipo de consulta fica na URL (?consulta=sem-alugueis).',
    'Consulta de exemplo do trabalho: rota GET /api/Clientes/filtro/sem-alugueis (LEFT JOIN no banco).',
    'Alugar abre o formulário de aluguel já com o cliente selecionado.',
  ]);
  return s;
});

const veiculos = [
  ['BCD9L01', 'Toyota Corolla', '2024', '15.600 km', 'Sedã'],
  ['HIJ1N23', 'Hyundai HB20', '2022', '36.400 km', 'Econômico'],
  ['EFG0M12', 'Toyota Hilux', '2023', '38.900 km', 'Utilitário'],
  ['NOP3P45', 'Renault Kwid', '2023', '22.700 km', 'Econômico'],
];
const colunasVeiculos = [
  { cab: 'Placa', w: 120, forte: true },
  { cab: 'Veículo', w: 200 },
  { cab: 'Ano', w: 80, num: true },
  { cab: 'Quilometragem', w: 150, num: true },
  { cab: 'Categoria', w: 140 },
  { cab: 'Situação', w: 130 },
  { cab: 'Ações', w: 330 },
];

novo('09-veiculos-lista', 'Veículos — listagem e filtros', () => {
  const s = moldura('Veículos', { ativo: 2, trilha: 'Painel / Veículos', subtitulo: 'Frota da locadora. Um veículo com aluguéis vinculados não pode ser excluído.', acao: 'Novo veículo' });
  abas(s, X, 120, ['Todos os veículos', 'Disponíveis', 'Por fabricante'], 0);
  barraFiltros(s, X, 172, W, [
    { rotulo: 'Placa', w: 130 },
    { rotulo: 'Modelo', w: 150 },
    { rotulo: 'Fabricante', w: 160, seletor: true, valor: 'Todos' },
    { rotulo: 'Categoria', w: 150, seletor: true, valor: 'Todas' },
    { rotulo: 'Disponibilidade', w: 160, seletor: true, valor: 'Todos' },
  ]);
  cartao(s, X, 292, W, 410);
  infoConsulta(s, X + 20, 310, W - 40, '/api/Veiculos', '15 resultados');
  tabela(
    s,
    X + 20,
    356,
    W - 40,
    colunasVeiculos,
    [
      ['ABC1D23', 'Fiat Mobi', '2023', '18.500 km', 'Econômico', { tom: 'sucesso', t: 'Disponível' }, ['Alugar', 'Editar', 'Excluir']],
      ['FGH2E34', 'Fiat Argo', '2022', '32.400 km', 'Econômico', { tom: 'aviso', t: 'Em locação' }, ['Editar', 'Excluir']],
      ['JKL3F45', 'Fiat Toro', '2023', '21.000 km', 'Utilitário', { tom: 'aviso', t: 'Em locação' }, ['Editar', 'Excluir']],
      ['MNO4G56', 'Volkswagen Polo', '2024', '9.800 km', 'Econômico', { tom: 'sucesso', t: 'Disponível' }, ['Alugar', 'Editar', 'Excluir']],
    ],
  );
  anotar(s, 1, X + 640, 186);
  anotar(s, 2, X + 6, 328);
  anotar(s, 3, X + 700, 380);
  notas(s, [
    'Filtros: placa, modelo, fabricante, categoria e disponibilidade (GET /api/Veiculos?placa=&modelo=&fabricanteId=&categoriaId=&disponivel=).',
    'Fabricante e categoria são carregados da API nos campos de seleção.',
    'O campo “disponivel” é calculado pelo banco (sem aluguel em aberto); veículos disponíveis têm o atalho Alugar.',
  ]);
  return s;
});

novo('10-veiculos-formulario', 'Veículos — cadastro e edição', () => {
  const s = moldura('Novo veículo', { ativo: 2, trilha: 'Painel / Veículos / Novo cadastro', subtitulo: 'Os campos marcados com * são obrigatórios.' });
  cartao(s, X, 124, 880, 470);
  campo(s, X + 28, 148, 390, 'Placa', 'ABC1D23', { obrigatorio: true, dica: 'Formatos aceitos: ABC1234, ABC-1234 ou ABC1D23.' });
  campo(s, X + 450, 148, 390, 'Modelo', 'Mobi', { obrigatorio: true });
  campo(s, X + 28, 262, 390, 'Ano de fabricação', '2023', { obrigatorio: true });
  campo(s, X + 450, 262, 390, 'Quilometragem (km)', '18500', { obrigatorio: true });
  campo(s, X + 28, 346, 390, 'Fabricante', 'Fiat', { obrigatorio: true, seletor: true });
  campo(s, X + 450, 346, 390, 'Categoria', 'Econômico', { obrigatorio: true, seletor: true });
  s.line(X + 28, 494, X + 852, 494);
  botao(s, X + 28, 518, 110, '✓  Salvar', 'primario');
  botao(s, X + 150, 518, 100, 'Cancelar', 'sec');
  anotar(s, 1, X + 430, 168);
  anotar(s, 2, X + 430, 368);
  notas(s, [
    'Validações espelham a API: placa nos formatos aceitos, ano entre 1900 e o próximo ano, quilometragem não negativa.',
    'Selects de fabricante e categoria preenchidos por GET /api/Fabricantes e GET /api/Categorias.',
  ]);
  return s;
});

novo('11-veiculos-disponiveis', 'Veículos disponíveis (consulta LEFT JOIN)', () => {
  const s = moldura('Veículos', { ativo: 2, trilha: 'Painel / Veículos', subtitulo: 'Frota da locadora. Um veículo com aluguéis vinculados não pode ser excluído.', acao: 'Novo veículo' });
  abas(s, X, 120, ['Todos os veículos', 'Disponíveis', 'Por fabricante'], 1);
  s.text(X, 188, 'Veículos sem aluguel em aberto, ou seja, prontos para locação (LEFT JOIN entre Veículos e Aluguéis sem devolução).', { size: 14, fill: COR.suave });
  cartao(s, X, 208, W, 400);
  infoConsulta(s, X + 20, 226, W - 40, '/api/Veiculos/filtro/disponiveis', '10 resultados');
  tabela(
    s,
    X + 20,
    272,
    W - 40,
    colunasVeiculos,
    veiculos.map(([p, v, a, k, c]) => [p, v, a, k, c, { tom: 'sucesso', t: 'Disponível' }, ['Alugar', 'Editar', 'Excluir']]),
  );
  anotar(s, 1, X + 300, 120);
  anotar(s, 2, X + 6, 244);
  anotar(s, 3, X + 700, 296);
  notas(s, [
    'Primeira consulta de demonstração: SQL/Entity Framework (LEFT JOIN) → GET /api/Veiculos/filtro/disponiveis → esta tela.',
    'A barra mostra a rota exata chamada e a quantidade de resultados retornados pela API.',
    'Cada linha oferece o atalho Alugar, que abre o formulário de aluguel com o veículo já selecionado.',
  ]);
  return s;
});

novo('18-veiculos-por-fabricante', 'Veículos por fabricante (consulta INNER JOIN)', () => {
  const s = moldura('Veículos', { ativo: 2, trilha: 'Painel / Veículos', subtitulo: 'Frota da locadora. Um veículo com aluguéis vinculados não pode ser excluído.', acao: 'Novo veículo' });
  abas(s, X, 120, ['Todos os veículos', 'Disponíveis', 'Por fabricante'], 2);
  s.text(X, 188, 'Veículos cujo fabricante contém o texto informado (INNER JOIN entre Veículos, Fabricantes e Categorias).', { size: 14, fill: COR.suave });
  cartao(s, X, 208, W, 100);
  campo(s, X + 20, 222, 380, 'Nome do fabricante', 'Toyota', { obrigatorio: true });
  botao(s, X + W - 190, 244, 100, 'Consultar', 'primario');
  botao(s, X + W - 82, 244, 66, 'Limpar', 'sec');
  cartao(s, X, 324, W, 240);
  infoConsulta(s, X + 20, 342, W - 40, '/api/Veiculos/filtro/fabricante?nome=Toyota', '2 resultados');
  tabela(s, X + 20, 388, W - 40, colunasVeiculos, [
    ['BCD9L01', 'Toyota Corolla', '2024', '15.600 km', 'Sedã', { tom: 'sucesso', t: 'Disponível' }, ['Alugar', 'Editar', 'Excluir']],
    ['EFG0M12', 'Toyota Hilux', '2023', '38.900 km', 'Utilitário', { tom: 'sucesso', t: 'Disponível' }, ['Alugar', 'Editar', 'Excluir']],
  ]);
  anotar(s, 1, X + 400, 240);
  anotar(s, 2, X + 6, 360);
  notas(s, [
    'O nome do fabricante é obrigatório; sem ele a tela orienta o usuário em vez de chamar a API.',
    'Rota GET /api/Veiculos/filtro/fabricante?nome= (INNER JOIN entre Veículos, Fabricantes e Categorias).',
  ]);
  return s;
});

const colunasAlugueis = [
  { cab: 'Cliente', w: 150 },
  { cab: 'Veículo', w: 150 },
  { cab: 'Período', w: 215 },
  { cab: 'Diária', w: 95, num: true },
  { cab: 'Total (API)', w: 105, num: true },
  { cab: 'Situação', w: 150 },
  { cab: 'Ações', w: 290 },
];

const linhasAlugueis = [
  ['Otávio Resende', 'KLM2O34 · Creta', 'Início  23/11/2026 09:00\nPrevisto  27/11/2026 09:00', 'R$ 169,90', '—', { tom: 'info', t: 'Em andamento' }, ['Devolver', 'Editar', 'Excluir']],
  ['Beatriz Nogueira', 'FGH2E34 · Argo', 'Início  18/11/2026 09:00\nPrevisto  22/11/2026 09:00', 'R$ 129,90', '—', { tom: 'perigo', t: 'Atrasado' }, ['Devolver', 'Editar', 'Excluir']],
  ['Luiza Cordeiro', 'VWX7J89 · Onix', 'Início  18/11/2026 09:00\nPrevisto  20/11/2026 09:00\nDevolvido  20/11/2026 09:00', 'R$ 109,90', 'R$ 219,80', { tom: 'sucesso', t: 'Devolvido' }, ['Editar', 'Excluir']],
];

novo('12-alugueis-lista', 'Aluguéis — listagem e filtros', () => {
  const s = moldura('Aluguéis', { ativo: 1, trilha: 'Painel / Aluguéis', subtitulo: 'Locações de veículos, devoluções e histórico. O valor total é calculado pela API na devolução.', acao: 'Novo aluguel' });
  abas(s, X, 120, ['Todos os aluguéis', 'Por período', 'Histórico por cliente'], 0);
  barraFiltros(s, X, 172, W, [
    { rotulo: 'Cliente', w: 160, seletor: true, valor: 'Todos' },
    { rotulo: 'Veículo', w: 160, seletor: true, valor: 'Todos' },
    { rotulo: 'Situação', w: 140, seletor: true, valor: 'Todas' },
    { rotulo: 'Início a partir de', w: 150, valor: 'dd/mm/aaaa' },
    { rotulo: 'Início até', w: 150, valor: 'dd/mm/aaaa' },
  ]);
  cartao(s, X, 292, W, 500);
  infoConsulta(s, X + 20, 310, W - 40, '/api/Alugueis', '16 resultados');
  tabela(s, X + 20, 356, W - 40, colunasAlugueis, linhasAlugueis, { alturaLinha: 80 });
  anotar(s, 1, X + 660, 186);
  anotar(s, 2, X + 6, 328);
  anotar(s, 3, X + W - 30, 380);
  notas(s, [
    'Filtros: cliente, veículo, situação e período de início (GET /api/Alugueis?clienteId=&veiculoId=&situacao=&inicio=&fim=).',
    'A situação (em andamento, atrasado ou devolvido) é calculada pela API; o valor total também vem da API.',
    'Devolver abre a janela de devolução; está disponível apenas para aluguéis em aberto.',
  ]);
  return s;
});

novo('13-alugueis-formulario', 'Aluguéis — cadastro e edição', () => {
  const s = moldura('Novo aluguel', { ativo: 1, trilha: 'Painel / Aluguéis / Novo cadastro', subtitulo: 'Os campos marcados com * são obrigatórios.' });
  cartao(s, X, 124, 880, 660);
  s.rect(X + 24, 148, 832, 300, { stroke: COR.linha, rx: 10 });
  s.text(X + 40, 156, 'Locação', { size: 14, weight: 700 });
  s.rect(X + 32, 142, 70, 18, { fill: '#fff' });
  s.text(X + 40, 156, 'Locação', { size: 14, weight: 700 });
  campo(s, X + 44, 174, 380, 'Cliente', 'Mariana Albuquerque', { obrigatorio: true, seletor: true });
  campo(s, X + 456, 174, 380, 'Veículo', 'ABC1D23 · Fiat Mobi', { obrigatorio: true, seletor: true });
  campo(s, X + 44, 262, 380, 'Início', '24/11/2026 09:00', { obrigatorio: true });
  campo(s, X + 456, 262, 380, 'Fim previsto', '27/11/2026 09:00', { obrigatorio: true });
  campo(s, X + 44, 350, 380, 'Quilometragem inicial (km)', '18500', { obrigatorio: true });
  campo(s, X + 456, 350, 380, 'Valor da diária (R$)', '119.90', { obrigatorio: true });
  s.rect(X + 24, 470, 832, 220, { stroke: COR.linha, rx: 10 });
  s.rect(X + 32, 462, 180, 18, { fill: '#fff' });
  s.text(X + 40, 476, 'Devolução (opcional)', { size: 14, weight: 700 });
  s.text(X + 44, 504, 'Preencha a data e a quilometragem final apenas quando o veículo já tiver sido devolvido.', { size: 13, fill: COR.suave });
  campo(s, X + 44, 516, 380, 'Data e hora da devolução', '');
  campo(s, X + 456, 516, 380, 'Quilometragem final (km)', '');
  s.rect(X + 44, 628, 792, 40, { fill: '#e3f2fd', rx: 8 });
  s.text(X + 56, 653, 'Estimativa: 3 diárias × R$ 119,90 = R$ 359,70. O valor oficial é calculado pela API ao salvar.', { size: 13, fill: '#0d5aa7' });
  s.line(X + 28, 706, X + 852, 706);
  botao(s, X + 28, 724, 110, '✓  Salvar', 'primario');
  botao(s, X + 150, 724, 100, 'Cancelar', 'sec');
  anotar(s, 1, X + 440, 190);
  anotar(s, 2, X + 440, 372);
  anotar(s, 3, X + 440, 534);
  notas(s, [
    'Em um novo aluguel, o select de veículos usa GET /api/Veiculos/filtro/disponiveis; ao editar, lista todos os veículos.',
    'A quilometragem inicial acompanha o veículo escolhido; as regras de datas e quilometragens espelham a validação da API.',
    'A estimativa é apenas visual e identificada como tal: o valor oficial (ValorTotal) é calculado e devolvido pela API.',
  ]);
  return s;
});

novo('14-alugueis-por-periodo', 'Aluguéis por período (consulta INNER JOIN)', () => {
  const s = moldura('Aluguéis', { ativo: 1, trilha: 'Painel / Aluguéis', subtitulo: 'Locações de veículos, devoluções e histórico. O valor total é calculado pela API na devolução.', acao: 'Novo aluguel' });
  abas(s, X, 120, ['Todos os aluguéis', 'Por período', 'Histórico por cliente'], 1);
  s.text(X, 188, 'Aluguéis iniciados dentro do período, do mais antigo ao mais recente (INNER JOIN entre Aluguéis, Clientes e Veículos).', { size: 14, fill: COR.suave });
  cartao(s, X, 208, W, 100);
  campo(s, X + 20, 222, 220, 'Data inicial', '15/11/2026', { obrigatorio: true });
  campo(s, X + 256, 222, 220, 'Data final', '30/11/2026', { obrigatorio: true });
  botao(s, X + W - 190, 244, 100, 'Consultar', 'primario');
  botao(s, X + W - 82, 244, 66, 'Limpar', 'sec');
  cartao(s, X, 324, W, 440);
  infoConsulta(s, X + 20, 342, W - 40, '/api/Alugueis/filtro/periodo?inicio=2026-11-15&fim=2026-11-30', '7 resultados', 'Período: 15/11/2026 a 30/11/2026');
  tabela(s, X + 20, 410, W - 40, colunasAlugueis, linhasAlugueis.slice(0, 3), { alturaLinha: 80 });
  anotar(s, 1, X + 500, 240);
  anotar(s, 2, X + 6, 360);
  anotar(s, 3, X + 700, 450);
  notas(s, [
    'Segunda consulta de demonstração: SQL/Entity Framework (INNER JOIN) → GET /api/Alugueis/filtro/periodo → tabela de resultados.',
    'As datas são obrigatórias; se a data final for anterior à inicial, a API responde 400 e a mensagem é exibida na tela.',
    'O período considera a data de início do aluguel; cada linha mostra situação e valor total retornados pela API.',
  ]);
  return s;
});

novo('19-alugueis-historico-cliente', 'Histórico de aluguéis por cliente', () => {
  const s = moldura('Aluguéis', { ativo: 1, trilha: 'Painel / Aluguéis', subtitulo: 'Locações de veículos, devoluções e histórico. O valor total é calculado pela API na devolução.', acao: 'Novo aluguel' });
  abas(s, X, 120, ['Todos os aluguéis', 'Por período', 'Histórico por cliente'], 2);
  s.text(X, 188, 'Todos os aluguéis de um cliente, com o fabricante do veículo (INNER JOIN entre Aluguéis, Veículos e Fabricantes).', { size: 14, fill: COR.suave });
  cartao(s, X, 208, W, 100);
  campo(s, X + 20, 222, 380, 'Cliente', 'Rafael Tavares', { obrigatorio: true, seletor: true });
  botao(s, X + W - 190, 244, 100, 'Consultar', 'primario');
  botao(s, X + W - 82, 244, 66, 'Limpar', 'sec');
  cartao(s, X, 324, W, 330);
  infoConsulta(s, X + 20, 342, W - 40, '/api/Alugueis/filtro/cliente/2', '3 resultados', 'Cliente: Rafael Tavares');
  tabela(
    s,
    X + 20,
    410,
    W - 40,
    [
      { cab: 'Veículo', w: 230 },
      { cab: 'Período', w: 250 },
      { cab: 'Diária', w: 110, num: true },
      { cab: 'Total (API)', w: 120, num: true },
      { cab: 'Situação', w: 130 },
      { cab: 'Ações', w: 280 },
    ],
    [
      ['WXY6S78 · Volkswagen Jetta', 'Início  15/11/2026 09:00\nPrevisto  20/11/2026 09:00', 'R$ 249,90', '—', { tom: 'perigo', t: 'Atrasado' }, ['Devolver', 'Editar', 'Excluir']],
      ['STU6I78 · Volkswagen T-Cross', 'Início  10/11/2026 09:00\nPrevisto  15/11/2026 09:00\nDevolvido  15/11/2026 09:00', 'R$ 179,90', 'R$ 899,50', { tom: 'sucesso', t: 'Devolvido' }, ['Editar', 'Excluir']],
    ],
    { alturaLinha: 80 },
  );
  anotar(s, 1, X + 400, 240);
  anotar(s, 2, X + 6, 360);
  notas(s, [
    'Seleção do cliente alimentada por GET /api/Clientes; também acessível pelo botão Histórico na lista de clientes.',
    'Rota GET /api/Alugueis/filtro/cliente/{id}: aluguéis do cliente com o fabricante de cada veículo.',
  ]);
  return s;
});

function esmaecer(s) {
  s.rect(0, 0, L, AREA, { fill: '#0b1f26', op: 0.62 });
}

novo('15-alugueis-devolucao', 'Registrar devolução (janela)', () => {
  const s = moldura('Aluguéis', { ativo: 1, trilha: 'Painel / Aluguéis', subtitulo: 'Locações de veículos, devoluções e histórico.', acao: 'Novo aluguel' });
  abas(s, X, 120, ['Todos os aluguéis', 'Por período', 'Histórico por cliente'], 0);
  cartao(s, X, 178, W, 400);
  esmaecer(s);
  const dx = 400;
  const dy = 150;
  s.rect(dx, dy, 640, 560, { fill: '#fff', rx: 14 });
  s.text(dx + 28, dy + 44, 'Registrar devolução', { size: 22, weight: 700 });
  s.text(dx + 28, dy + 76, 'Aluguel #16 · Beatriz Nogueira · FGH2E34 Argo', { size: 14, fill: COR.suave });
  s.text(dx + 28, dy + 98, 'Início em 18/11/2026 09:00 · fim previsto em 22/11/2026 09:00 · diária R$ 129,90', { size: 13, fill: COR.suave });
  campo(s, dx + 28, dy + 120, 280, 'Data e hora da devolução', '24/11/2026 14:30', { obrigatorio: true });
  campo(s, dx + 332, dy + 120, 280, 'Quilometragem final (km)', '32850', { obrigatorio: true, dica: 'Quilometragem inicial: 32400 km' });
  s.rect(dx + 28, dy + 262, 584, 64, { fill: '#e3f2fd', rx: 8 });
  s.text(dx + 40, dy + 288, 'Estimativa: 7 diárias × R$ 129,90 = R$ 909,30.', { size: 13, weight: 700, fill: '#0d5aa7' });
  s.text(dx + 40, dy + 308, 'O valor oficial é calculado pela API ao registrar a devolução.', { size: 13, fill: '#0d5aa7' });
  botao(s, dx + 28, dy + 350, 100, 'Cancelar', 'sec');
  botao(s, dx + 140, dy + 350, 200, '↩  Registrar devolução', 'primario');
  s.rect(dx + 28, dy + 420, 584, 110, { fill: '#e8f5e9', rx: 10 });
  s.text(dx + 44, dy + 452, 'Após confirmar (aviso de sucesso):', { size: 13, weight: 700, fill: '#2e7d32' });
  s.text(dx + 44, dy + 476, 'Devolução do aluguel 16 registrada. Valor total calculado pela API: R$ 909,30.', { size: 13, fill: '#2e7d32' });
  anotar(s, 1, dx + 300, dy + 140);
  anotar(s, 2, dx + 596, dy + 262);
  notas(s, [
    'A janela carrega o aluguel por GET /api/Alugueis/{id}; a data sugerida é o momento atual e a quilometragem parte da inicial.',
    'A API só possui PUT completo: a tela reenvia os dados do aluguel com a devolução preenchida e depois lê o valor total oficial.',
  ]);
  return s;
});

novo('16-confirmar-exclusao', 'Confirmação de exclusão', () => {
  const s = moldura('Fabricantes', { ativo: 4, trilha: 'Painel / Fabricantes', subtitulo: 'Marcas dos veículos da frota.', acao: 'Novo fabricante' });
  barraFiltros(s, X, 124, W, [
    { rotulo: 'Código', w: 160 },
    { rotulo: 'Nome', w: 360 },
  ]);
  cartao(s, X, 244, W, 200);
  esmaecer(s);
  const dx = 440;
  const dy = 260;
  s.rect(dx, dy, 560, 250, { fill: '#fff', rx: 14 });
  s.text(dx + 28, dy + 46, 'Excluir fabricante?', { size: 22, weight: 700 });
  s.text(dx + 28, dy + 84, 'Deseja realmente excluir o fabricante “Fiat”? Esta ação não pode ser desfeita.', { size: 14, fill: COR.suave });
  botao(s, dx + 28, dy + 170, 100, 'Cancelar', 'sec');
  botao(s, dx + 140, dy + 170, 120, 'Excluir', 'perigo');
  s.rect(dx + 28, dy + 124, 504, 34, { fill: '#ffebee', rx: 8 });
  s.text(dx + 40, dy + 146, 'Se houver veículos vinculados, a API responde 409 e a mensagem é exibida.', { size: 12, fill: COR.perigo });
  anotar(s, 1, dx + 300, dy + 30);
  notas(s, [
    'Toda exclusão (nas cinco entidades) passa por esta confirmação, com o foco inicial em “Cancelar” e fechamento por Esc.',
    'Sucesso: aviso verde e lista atualizada. Conflito (409): aviso vermelho com a mensagem da API, sem alterar os dados.',
  ]);
  return s;
});

novo('17-estados', 'Estados: carregando, vazio, erro e avisos', () => {
  const s = new Tela();
  s.rect(0, 0, L, 1400, { fill: '#fff' });
  s.rect(0, 0, L, AREA, { fill: COR.fundo });
  s.text(40, 56, 'Estados de interface', { size: 30, weight: 700 });
  s.text(40, 84, 'Todos os componentes de lista e formulário compartilham estes padrões.', { size: 14, fill: COR.suave });
  const paineis = [
    ['Carregando', 40, 120],
    ['Lista vazia', 740, 120],
    ['Erro de comunicação', 40, 480],
    ['Avisos (toasts)', 740, 480],
  ];
  for (const [t, x, y] of paineis) {
    cartao(s, x, y, 660, 320);
    s.text(x + 24, y + 36, t, { size: 16, weight: 700, fill: COR.suave });
  }
  // Carregando
  s.circle(370, 270, 22, { stroke: '#cfe3e8', sw: 5 });
  s.add(`<path d="M370 248 A22 22 0 0 1 392 270" fill="none" stroke="${COR.primaria}" stroke-width="5" stroke-linecap="round"/>`);
  s.text(370, 330, 'Carregando veículos…', { size: 15, fill: COR.suave, anchor: 'middle' });
  // Vazio
  s.text(1070, 250, 'Nenhum veículo encontrado', { size: 18, weight: 700, anchor: 'middle' });
  s.text(1070, 280, 'Ajuste ou limpe os filtros para ver outros resultados.', { size: 14, fill: COR.suave, anchor: 'middle' });
  botao(s, 1010, 306, 120, 'Limpar filtros', 'sec');
  // Erro
  s.text(370, 600, 'Não foi possível carregar os dados', { size: 18, weight: 700, fill: COR.perigo, anchor: 'middle' });
  s.text(370, 630, 'Não foi possível conectar à API. Verifique se o servidor está em execução e tente novamente.', { size: 13, fill: COR.perigo, anchor: 'middle' });
  botao(s, 300, 660, 140, '↩  Tentar novamente', 'sec');
  // Toasts
  s.rect(770, 540, 600, 52, { fill: '#14532d', rx: 10 });
  s.text(792, 572, '✓  Fabricante “Honda” cadastrado com sucesso.', { size: 14, fill: '#fff' });
  s.rect(770, 606, 600, 52, { fill: '#991b1b', rx: 10 });
  s.text(792, 638, '!  Não é possível excluir o fabricante: existem veículos vinculados.', { size: 14, fill: '#fff' });
  s.rect(770, 672, 600, 100, { fill: '#ffebee', stroke: '#f3b4b4', rx: 8 });
  s.rect(770, 672, 5, 100, { fill: COR.perigo });
  s.text(792, 700, 'Corrija os itens abaixo para continuar:', { size: 14, weight: 700, fill: COR.perigo });
  s.text(792, 724, '•  O nome do fabricante é obrigatório.', { size: 13, fill: COR.perigo });
  s.text(792, 744, '•  O CPF deve conter exatamente 11 dígitos numéricos.', { size: 13, fill: COR.perigo });
  anotar(s, 1, 700, 138);
  anotar(s, 2, 1380, 138);
  anotar(s, 3, 700, 498);
  anotar(s, 4, 1380, 498);
  notas(s, [
    'Carregando: indicador com role=status enquanto a API responde.',
    'Vazio: mensagem explicativa e ação para limpar filtros ou cadastrar o primeiro registro.',
    'Erro: API indisponível, falha de rede, 400, 404, 409 e 500 viram mensagens compreensíveis, com botão para tentar novamente.',
    'Avisos de sucesso/erro (aria-live) e resumo de erros de validação nos formulários.',
  ]);
  return s;
});

/* ---------- Execução ---------- */
const arquivos = [];
for (const q of quadros) {
  const tela = q.montar();
  writeFileSync(join(destinoSvg, `${q.arquivo}.svg`), tela.svg(q.arquivo, q.titulo), 'utf8');
  arquivos.push({ ...q, altura: tela.altura() });
}
console.log(`${arquivos.length} wireframes SVG gerados em ${destinoSvg}`);

const navegador = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const pagina = await navegador.newPage({ viewport: { width: L, height: 1000 } });
for (const q of arquivos) {
  await pagina.setViewportSize({ width: L, height: q.altura });
  await pagina.goto(pathToFileURL(join(destinoSvg, `${q.arquivo}.svg`)).href);
  await pagina.screenshot({ path: join(destino, `${q.arquivo}.png`) });
}
await navegador.close();
console.log(`PNGs exportados em ${destino}`);
