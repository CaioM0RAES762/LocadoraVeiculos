# -*- coding: utf-8 -*-
"""
Gera artigo.tex, referencias.bib e artigo.docx a partir de conteudo.py.

    python gerar_artigo.py

O PDF é produzido a partir do .docx (Word: Arquivo > Salvar como PDF) ou, se houver LaTeX, compilando artigo.tex:
    pdflatex artigo && bibtex artigo && pdflatex artigo && pdflatex artigo
"""
import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

import conteudo as C

AQUI = Path(__file__).resolve().parent

# ----------------------------------------------------------------------------------------------
# Numeração e rótulos de citação
# ----------------------------------------------------------------------------------------------
figuras, tabelas = {}, {}
for bloco in C.CORPO:
    if bloco[0] == "fig":
        figuras[bloco[1]] = len(figuras) + 1
    elif bloco[0] == "tab":
        tabelas[bloco[1]] = len(tabelas) + 1

ordem_refs = sorted(C.REFERENCIAS, key=lambda k: (C.REFERENCIAS[k][1].lower()))
contagem = {}
for k in ordem_refs:
    contagem.setdefault(C.REFERENCIAS[k][0], []).append(k)
rotulo_cit = {}
for rotulo, chaves in contagem.items():
    for i, k in enumerate(chaves):
        rotulo_cit[k] = rotulo if len(chaves) == 1 else f"{rotulo}{chr(ord('a') + i)}"

citadas = []
for bloco in C.CORPO:
    textos = []
    if bloco[0] in ("p", "code"):
        textos.append(bloco[1])
    elif bloco[0] in ("ul", "ol"):
        textos += bloco[1]
    elif bloco[0] == "tab":
        textos += [c for linha in bloco[4] for c in linha]
    for t in textos:
        for m in re.finditer(r"\{cite:([^}]+)\}", t):
            for k in m.group(1).split(","):
                if k not in citadas:
                    citadas.append(k)

TOKEN = re.compile(
    r"(\[PREENCHER:[^\]]*\]|\*\*.+?\*\*|`[^`]+`|\{cite:[^}]+\}|\{(?:fig|tab):[^}]+\}|(?<![\w*])\*[^*\s][^*]*?\*(?![\w*]))"
)


def aspas(texto: str) -> str:
    """Troca aspas retas por tipográficas, alternando abertura e fechamento."""
    saida, abre = [], True
    for ch in texto:
        if ch == '"':
            saida.append("\u201c" if abre else "\u201d")
            abre = not abre
        else:
            saida.append(ch)
    return "".join(saida)


# ----------------------------------------------------------------------------------------------
# LaTeX
# ----------------------------------------------------------------------------------------------
def tex_escape(t: str) -> str:
    mapa = {
        "\\": r"\textbackslash{}", "&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#", "_": r"\_",
        "{": r"\{", "}": r"\}", "~": r"\textasciitilde{}", "^": r"\textasciicircum{}",
    }
    return "".join(mapa.get(c, c) for c in t)


def tex_code(t: str) -> str:
    esc = tex_escape(t).replace('"', r"\textquotedbl{}")
    esc = esc.replace("/", r"/\allowbreak{}").replace(r"\_", r"\_\allowbreak{}").replace(".", r".\allowbreak{}")
    return r"\texttt{" + esc + "}"


def tex_inline(texto: str) -> str:
    partes = TOKEN.split(texto)
    saida = []
    for p in partes:
        if not p:
            continue
        if p.startswith("[PREENCHER:"):
            saida.append(r"\textbf{" + tex_escape(p) + "}")
        elif p.startswith("**"):
            saida.append(r"\textbf{" + tex_inline(p[2:-2]) + "}")
        elif p.startswith("`"):
            saida.append(tex_code(p[1:-1]))
        elif p.startswith("{cite:"):
            saida.append(r"\cite{" + p[6:-1] + "}")
        elif p.startswith("{fig:"):
            saida.append(r"Figura~\ref{fig:" + p[5:-1] + "}")
        elif p.startswith("{tab:"):
            saida.append(r"Tabela~\ref{tab:" + p[5:-1] + "}")
        elif p.startswith("*") and p.endswith("*") and len(p) > 2:
            saida.append(r"\emph{" + tex_inline(p[1:-1]) + "}")
        else:
            saida.append(tex_escape(aspas(p)))
    return "".join(saida)


def gerar_tex() -> str:
    L = []
    add = L.append
    add(r"""% Relatório da Etapa 2 — Locadora de Veículos (padrão de artigos da SBC).
% Compilar com:  pdflatex artigo && bibtex artigo && pdflatex artigo && pdflatex artigo
% Para o visual oficial, coloque sbc-template.sty e sbc.bst (modelo da SBC) nesta pasta; sem eles, um layout equivalente é usado.
% Observação: este arquivo NÃO foi compilado no ambiente de desenvolvimento (não havia LaTeX instalado); o PDF vem da versão .docx.
\documentclass[12pt]{article}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[brazil]{babel}
\usepackage{graphicx}
\usepackage{array}
\usepackage{url}
\makeatletter
\IfFileExists{sbc-template.sty}{%
  \usepackage{sbc-template}%
}{%
  \usepackage{times}
  \usepackage[a4paper,left=2.75cm,right=2.75cm,top=3.5cm,bottom=2.5cm]{geometry}
  \usepackage{titlesec}
  \titleformat{\section}{\large\bfseries}{\thesection.}{0.5em}{}
  \titleformat{\subsection}{\normalsize\bfseries}{\thesubsection.}{0.5em}{}
  \titlespacing*{\section}{0pt}{14pt}{6pt}
  \titlespacing*{\subsection}{0pt}{10pt}{4pt}
  \providecommand{\address}[1]{\par{\centering\small\emph{#1}\par}}
  \renewenvironment{abstract}{\par\small\noindent\textbf{Abstract.}\ }{\par\medskip}
  \renewcommand{\maketitle}{%
    \begin{center}
      {\Large\bfseries \@title\par}
      \vspace{1.2em}
      {\normalsize\bfseries \@author\par}
    \end{center}}
  \setlength{\parindent}{1cm}
  \pagestyle{plain}
}
\@ifundefined{resumo}{%
  \newenvironment{resumo}{\par\small\noindent\textbf{Resumo.}\ }{\par\medskip}%
}{}
\makeatother
\emergencystretch=3em
\sloppy
""")
    add("\\title{" + tex_escape(C.TITULO) + "}")
    add("\\author{" + tex_escape(C.AUTOR) + "\\\\\n  \\small " + tex_escape(C.INSTITUICAO) + "\\\\\n  \\small " + tex_escape(C.EMAIL) + "}")
    add("\\address{" + tex_escape(C.DISCIPLINA) + "}")
    add("\n\\begin{document}\n\\maketitle\n")
    add("\\begin{abstract}\n" + tex_escape(C.ABSTRACT) + "\n\n\\noindent\\textbf{Keywords:} " + tex_escape(C.KEYWORDS) + ".\n\\end{abstract}\n")
    add("\\begin{resumo}\n" + tex_escape(C.RESUMO) + "\n\n\\noindent\\textbf{Palavras-chave:} " + tex_escape(C.PALAVRAS_CHAVE) + ".\n\\end{resumo}\n")

    for b in C.CORPO:
        tipo = b[0]
        if tipo == "h1":
            add("\\section{" + tex_inline(b[1]) + "}\n")
        elif tipo == "h2":
            add("\\subsection{" + tex_inline(b[1]) + "}\n")
        elif tipo == "p":
            add(tex_inline(b[1]) + "\n")
        elif tipo in ("ul", "ol"):
            amb = "itemize" if tipo == "ul" else "enumerate"
            add("\\begin{" + amb + "}\n" + "\n".join("  \\item " + tex_inline(i) for i in b[1]) + "\n\\end{" + amb + "}\n")
        elif tipo == "fig":
            _, chave, arq, legenda, larg = b
            add("\\begin{figure}[ht]\n  \\centering\n  \\includegraphics[width=" + f"{larg}cm" + "]{imagens/" + arq + "}\n  \\caption{" + tex_inline(legenda)
                + "}\n  \\label{fig:" + chave + "}\n\\end{figure}\n")
        elif tipo == "tab":
            _, chave, legenda, cab, linhas, larguras = b
            colunas = "|".join(r">{\raggedright\arraybackslash}p{" + f"{w}cm" + "}" for w in larguras)
            corpo = ["\\hline", " & ".join(r"\textbf{" + tex_inline(c) + "}" for c in cab) + " \\\\ \\hline"]
            for linha in linhas:
                corpo.append(" & ".join(tex_inline(c) for c in linha) + " \\\\ \\hline")
            add("\\begin{table}[ht]\n  \\centering\n  \\caption{" + tex_inline(legenda) + "}\n  \\label{tab:" + chave + "}\n  \\small\n  \\begin{tabular}{|" + colunas
                + "|}\n  " + "\n  ".join(corpo) + "\n  \\end{tabular}\n\\end{table}\n")
        elif tipo == "code":
            add("{\\footnotesize\n\\begin{verbatim}\n" + b[1] + "\n\\end{verbatim}\n}\n")

    add("\\bibliographystyle{plain}\n\\bibliography{referencias}\n\n\\end{document}\n")
    return "\n".join(L)


def gerar_bib() -> str:
    saida = ["% Referências do relatório. Fontes: documentações oficiais e a tese de Fielding (ver conteudo.py)."]
    for k in sorted(citadas):
        rot, _completa, campos = C.REFERENCIAS[k]
        if k == "fielding":
            saida.append(
                "@phdthesis{fielding,\n  author = {Fielding, Roy Thomas},\n  title = {Architectural Styles and the Design of Network-based Software Architectures},\n"
                "  school = {University of California, Irvine},\n  year = {2000},\n  type = {Tese (Doutorado)}\n}"
            )
            continue
        campos = dict(campos)
        campos.setdefault("year", "s.d." if "s.d." in rot else rot.split(", ")[-1])
        linhas = ",\n".join(f"  {n} = {{{v}}}" for n, v in campos.items())
        saida.append(f"@misc{{{k},\n{linhas}\n}}")
    return "\n\n".join(saida) + "\n"


# ----------------------------------------------------------------------------------------------
# DOCX
# ----------------------------------------------------------------------------------------------
FONTE = "Times New Roman"


def set_fonte(run, tam=None, nome=FONTE, negrito=None, italico=None):
    run.font.name = nome
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for atributo in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(atributo), nome)
    if tam:
        run.font.size = Pt(tam)
    if negrito is not None:
        run.bold = negrito
    if italico is not None:
        run.italic = italico


def estilo_fonte(estilo, tam, negrito=False, italico=False):
    estilo.font.name = FONTE
    estilo.font.size = Pt(tam)
    estilo.font.bold = negrito
    estilo.font.italic = italico
    estilo.font.color.rgb = None
    rpr = estilo.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for atributo in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rfonts.set(qn(atributo), FONTE)
    for atributo in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        if rfonts.get(qn(atributo)) is not None:
            del rfonts.attrib[qn(atributo)]


def sombrear(elemento_pr, cor):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), cor)
    elemento_pr.append(shd)


def runs(par, texto, tam=None, negrito=False, italico=False):
    for p in TOKEN.split(texto):
        if not p:
            continue
        if p.startswith("[PREENCHER:"):
            r = par.add_run(p)
            set_fonte(r, tam, negrito=True, italico=italico)
            r.font.highlight_color = WD_COLOR_INDEX.YELLOW
        elif p.startswith("**"):
            runs(par, p[2:-2], tam, True, italico)
        elif p.startswith("`"):
            r = par.add_run(p[1:-1])
            set_fonte(r, (tam or 12) - 1.5, nome="Consolas", negrito=negrito, italico=italico)
        elif p.startswith("{cite:"):
            rotulos = [rotulo_cit[k] for k in p[6:-1].split(",")]
            r = par.add_run("(" + "; ".join(rotulos) + ")")
            set_fonte(r, tam, negrito=negrito, italico=italico)
        elif p.startswith("{fig:"):
            r = par.add_run(f"Figura {figuras[p[5:-1]]}")
            set_fonte(r, tam, negrito=negrito, italico=italico)
        elif p.startswith("{tab:"):
            r = par.add_run(f"Tabela {tabelas[p[5:-1]]}")
            set_fonte(r, tam, negrito=negrito, italico=italico)
        elif p.startswith("*") and p.endswith("*") and len(p) > 2:
            runs(par, p[1:-1], tam, negrito, True)
        else:
            r = par.add_run(aspas(p))
            set_fonte(r, tam, negrito=negrito, italico=italico)


def paragrafo(doc, texto="", alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY, recuo=None, tam=None, antes=0, depois=6, manter=False, estilo=None):
    par = doc.add_paragraph(style=estilo)
    par.alignment = alinhamento
    pf = par.paragraph_format
    pf.space_before, pf.space_after = Pt(antes), Pt(depois)
    pf.first_line_indent = Cm(recuo) if recuo is not None else None
    pf.keep_with_next = manter
    if texto:
        runs(par, texto, tam)
    return par


def campo_pagina(par):
    for tipo, texto in (("begin", None), (None, "PAGE"), ("end", None)):
        r = par.add_run()
        set_fonte(r, 10)
        if tipo:
            f = OxmlElement("w:fldChar")
            f.set(qn("w:fldCharType"), tipo)
            r._element.append(f)
        else:
            i = OxmlElement("w:instrText")
            i.set(qn("xml:space"), "preserve")
            i.text = texto
            r._element.append(i)


def gerar_docx(caminho: Path):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
    sec.left_margin = sec.right_margin = Cm(2.75)
    sec.top_margin, sec.bottom_margin = Cm(3.0), Cm(2.5)

    estilo_fonte(doc.styles["Normal"], 12)
    for nome, tam in (("Heading 1", 13), ("Heading 2", 12)):
        est = doc.styles[nome]
        estilo_fonte(est, tam, negrito=True)
        est.paragraph_format.keep_with_next = True
        est.paragraph_format.space_before = Pt(14 if nome == "Heading 1" else 10)
        est.paragraph_format.space_after = Pt(6 if nome == "Heading 1" else 4)
        est.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    core = doc.core_properties
    core.title, core.author, core.subject, core.language = C.TITULO, C.AUTOR, "Trabalho Prático — Etapa 2", "pt-BR"

    # Rodapé com número da página
    campo_pagina(sec.footer.paragraphs[0])
    sec.footer.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER

    # Título e autoria
    t = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, depois=14)
    set_fonte(t.add_run(C.TITULO), 16, negrito=True)
    a = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, depois=0)
    runs(a, "**" + C.AUTOR + "**")
    for linha in (C.INSTITUICAO, C.EMAIL, C.DISCIPLINA):
        p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, depois=0)
        runs(p, linha, 11, italico=True)
    paragrafo(doc, depois=6)

    for rotulo, texto, chaves in (("Abstract.", C.ABSTRACT, C.KEYWORDS), ("Resumo.", C.RESUMO, C.PALAVRAS_CHAVE)):
        p = paragrafo(doc, recuo=None, tam=11, depois=4)
        p.paragraph_format.left_indent = p.paragraph_format.right_indent = Cm(0.8)
        set_fonte(p.add_run(rotulo + " "), 11, negrito=True)
        set_fonte(p.add_run(texto), 11)
        k = paragrafo(doc, depois=10)
        k.paragraph_format.left_indent = k.paragraph_format.right_indent = Cm(0.8)
        set_fonte(k.add_run(("Keywords: " if rotulo == "Abstract." else "Palavras-chave: ")), 11, negrito=True)
        set_fonte(k.add_run(chaves + "."), 11)

    n1 = n2 = 0
    for b in C.CORPO:
        tipo = b[0]
        if tipo == "h1":
            n1, n2 = n1 + 1, 0
            doc.add_paragraph(f"{n1}. {b[1]}", style="Heading 1")
        elif tipo == "h2":
            n2 += 1
            doc.add_paragraph(f"{n1}.{n2}. {b[1]}", style="Heading 2")
        elif tipo == "p":
            paragrafo(doc, b[1], recuo=1.0)
        elif tipo in ("ul", "ol"):
            for i, item in enumerate(b[1], 1):
                p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY, depois=3)
                p.paragraph_format.left_indent = Cm(1.0)
                p.paragraph_format.first_line_indent = Cm(-0.5)
                runs(p, ("• " if tipo == "ul" else f"{i}. ") + item)
        elif tipo == "fig":
            _, chave, arq, legenda, larg = b
            p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, depois=4, antes=6, manter=True)
            p.add_run().add_picture(str(AQUI / "imagens" / arq), width=Cm(larg))
            cap = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, depois=12)
            set_fonte(cap.add_run(f"Figura {figuras[chave]}. "), 10, negrito=True)
            runs(cap, legenda, 10)
        elif tipo == "tab":
            _, chave, legenda, cab, linhas, larguras = b
            cap = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, depois=4, antes=8, manter=True)
            set_fonte(cap.add_run(f"Tabela {tabelas[chave]}. "), 10, negrito=True)
            runs(cap, legenda, 10)
            tabela = doc.add_table(rows=1, cols=len(cab))
            tabela.style = "Table Grid"
            tabela.alignment = WD_TABLE_ALIGNMENT.CENTER
            tabela.autofit = False
            for i, texto in enumerate(cab):
                cel = tabela.rows[0].cells[i]
                sombrear(cel._element.get_or_add_tcPr(), "E3E8EB")
                runs(cel.paragraphs[0], "**" + texto + "**", 10)
            for linha in linhas:
                celulas = tabela.add_row().cells
                for i, texto in enumerate(linha):
                    runs(celulas[i].paragraphs[0], texto, 10)
            for linha in tabela.rows:
                trpr = linha._tr.get_or_add_trPr()
                trpr.append(OxmlElement("w:cantSplit"))
                for i, cel in enumerate(linha.cells):
                    cel.width = Cm(larguras[i])
                    for p in cel.paragraphs:
                        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                        p.paragraph_format.space_after = Pt(2)
                        p.paragraph_format.space_before = Pt(2)
            # repetir cabeçalho em quebra de página
            th = OxmlElement("w:tblHeader")
            tabela.rows[0]._tr.get_or_add_trPr().append(th)
            paragrafo(doc, depois=6)
        elif tipo == "code":
            linhas = b[1].split("\n")
            for i, linha in enumerate(linhas):
                p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.LEFT, depois=0, manter=i < len(linhas) - 1)
                p.paragraph_format.left_indent = Cm(0.6)
                sombrear(p._p.get_or_add_pPr(), "F1F4F6")
                set_fonte(p.add_run(linha if linha else " "), 9, nome="Consolas")
            paragrafo(doc, depois=6)

    # Referências
    doc.add_paragraph("Referências", style="Heading 1")
    for k in sorted(citadas, key=lambda x: C.REFERENCIAS[x][1].lower()):
        p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.LEFT, depois=4)
        p.paragraph_format.left_indent = Cm(0.8)
        p.paragraph_format.first_line_indent = Cm(-0.8)
        set_fonte(p.add_run(f"{rotulo_cit[k]}: "), 11, negrito=True)
        set_fonte(p.add_run(C.REFERENCIAS[k][1]), 11)

    doc.save(str(caminho))


# ----------------------------------------------------------------------------------------------
# HTML (usado apenas para imprimir o PDF com o navegador; não é um entregável)
# ----------------------------------------------------------------------------------------------
import html as _html


def h(t: str) -> str:
    return _html.escape(t, quote=False)


def html_inline(texto: str) -> str:
    saida = []
    for p in TOKEN.split(texto):
        if not p:
            continue
        if p.startswith("[PREENCHER:"):
            saida.append("<mark><strong>" + h(p) + "</strong></mark>")
        elif p.startswith("**"):
            saida.append("<strong>" + html_inline(p[2:-2]) + "</strong>")
        elif p.startswith("`"):
            saida.append("<code>" + h(p[1:-1]) + "</code>")
        elif p.startswith("{cite:"):
            saida.append("(" + "; ".join(h(rotulo_cit[k]) for k in p[6:-1].split(",")) + ")")
        elif p.startswith("{fig:"):
            saida.append(f"Figura {figuras[p[5:-1]]}")
        elif p.startswith("{tab:"):
            saida.append(f"Tabela {tabelas[p[5:-1]]}")
        elif p.startswith("*") and p.endswith("*") and len(p) > 2:
            saida.append("<em>" + html_inline(p[1:-1]) + "</em>")
        else:
            saida.append(h(aspas(p)))
    return "".join(saida)


CSS = """
@page { size: A4; }
body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.25; margin: 0; }
h1.titulo { text-align: center; font-size: 16pt; margin: 0 0 14pt; }
.autor { text-align: center; margin: 0; } .autor.sec { font-style: italic; font-size: 11pt; }
.resumo { font-size: 11pt; margin: 8pt 0.8cm 4pt; text-align: justify; }
h2 { font-size: 13pt; margin: 14pt 0 6pt; break-after: avoid; }
h3 { font-size: 12pt; margin: 10pt 0 4pt; break-after: avoid; }
p { margin: 0 0 6pt; text-align: justify; text-indent: 1cm; }
ul, ol { margin: 0 0 6pt; padding-left: 1.2cm; text-align: justify; } li { margin-bottom: 3pt; }
figure { margin: 8pt 0 12pt; text-align: center; break-inside: avoid; }
figure img { max-width: 100%; border: 1px solid #cfd8dc; }
figcaption, .legenda-tab { font-size: 10pt; text-align: center; margin-top: 4pt; }
.legenda-tab { margin: 8pt 0 4pt; break-after: avoid; }
table { border-collapse: collapse; margin: 0 auto 10pt; font-size: 10pt; table-layout: fixed; }
th, td { border: 1px solid #555; padding: 3pt 5pt; vertical-align: top; text-align: left; word-wrap: break-word; }
th { background: #e3e8eb; } tr { break-inside: avoid; } thead { display: table-header-group; }
pre { font-family: Consolas, 'Courier New', monospace; font-size: 9pt; background: #f1f4f6; padding: 6pt 8pt; margin: 0 0 10pt 0.6cm; break-inside: avoid; white-space: pre-wrap; }
code { font-family: Consolas, 'Courier New', monospace; font-size: 10.5pt; }
mark { background: #fff176; }
.ref { text-align: left; text-indent: -0.8cm; margin-left: 0.8cm; font-size: 11pt; margin-bottom: 4pt; }
"""


def gerar_html() -> str:
    o = []
    add = o.append
    add('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + h(C.TITULO) + "</title><style>" + CSS + "</style></head><body>")
    add('<h1 class="titulo">' + h(C.TITULO) + "</h1>")
    add('<p class="autor" style="text-indent:0"><strong>' + html_inline(C.AUTOR) + "</strong></p>")
    for linha in (C.INSTITUICAO, C.EMAIL, C.DISCIPLINA):
        add('<p class="autor sec" style="text-indent:0">' + html_inline(linha) + "</p>")
    add('<p class="resumo" style="text-indent:0"><strong>Abstract.</strong> ' + h(C.ABSTRACT) + "</p>")
    add('<p class="resumo" style="text-indent:0"><strong>Keywords:</strong> ' + h(C.KEYWORDS) + ".</p>")
    add('<p class="resumo" style="text-indent:0"><strong>Resumo.</strong> ' + h(C.RESUMO) + "</p>")
    add('<p class="resumo" style="text-indent:0"><strong>Palavras-chave:</strong> ' + h(C.PALAVRAS_CHAVE) + ".</p>")
    n1 = n2 = 0
    for b in C.CORPO:
        tipo = b[0]
        if tipo == "h1":
            n1, n2 = n1 + 1, 0
            add(f"<h2>{n1}. {html_inline(b[1])}</h2>")
        elif tipo == "h2":
            n2 += 1
            add(f"<h3>{n1}.{n2}. {html_inline(b[1])}</h3>")
        elif tipo == "p":
            add("<p>" + html_inline(b[1]) + "</p>")
        elif tipo in ("ul", "ol"):
            add(f"<{tipo}>" + "".join("<li>" + html_inline(i) + "</li>" for i in b[1]) + f"</{tipo}>")
        elif tipo == "fig":
            _, chave, arq, legenda, larg = b
            add(f'<figure><img src="imagens/{arq}" style="width:{larg}cm" alt="">'
                f"<figcaption><strong>Figura {figuras[chave]}.</strong> {html_inline(legenda)}</figcaption></figure>")
        elif tipo == "tab":
            _, chave, legenda, cab, linhas, larguras = b
            add(f'<div class="legenda-tab"><strong>Tabela {tabelas[chave]}.</strong> {html_inline(legenda)}</div>')
            add("<table><colgroup>" + "".join(f'<col style="width:{w}cm">' for w in larguras) + "</colgroup><thead><tr>"
                + "".join("<th>" + html_inline(c) + "</th>" for c in cab) + "</tr></thead><tbody>"
                + "".join("<tr>" + "".join("<td>" + html_inline(c) + "</td>" for c in l) + "</tr>" for l in linhas) + "</tbody></table>")
        elif tipo == "code":
            add("<pre>" + h(b[1]) + "</pre>")
    add("<h2>Referências</h2>")
    for k in sorted(citadas, key=lambda x: C.REFERENCIAS[x][1].lower()):
        add('<p class="ref"><strong>' + h(rotulo_cit[k]) + ":</strong> " + h(C.REFERENCIAS[k][1]) + "</p>")
    add("</body></html>")
    return "\n".join(o)


if __name__ == "__main__":
    (AQUI / "artigo.tex").write_text(gerar_tex(), encoding="utf-8")
    (AQUI / "referencias.bib").write_text(gerar_bib(), encoding="utf-8")
    try:
        gerar_docx(AQUI / "artigo.docx")
    except PermissionError:
        print("AVISO: artigo.docx está aberto/bloqueado por outro programa (ex.: Word); o .docx existente foi mantido.")
    (AQUI / "artigo.html").write_text(gerar_html(), encoding="utf-8")
    print("Gerados: artigo.tex, referencias.bib, artigo.docx e artigo.html (temporário, usado só para imprimir o PDF)")
    print("Figuras:", len(figuras), "· Tabelas:", len(tabelas), "· Referências citadas:", len(citadas))
