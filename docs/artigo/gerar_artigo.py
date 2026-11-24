# -*- coding: utf-8 -*-
"""
Gera artigo.tex, referencias.bib e artigo.docx a partir de conteudo.py.

    python gerar_artigo.py

O PDF é produzido compilando artigo.tex com o modelo oficial da SBC (sbc-template.sty e sbc.bst, nesta pasta):

    pdflatex artigo && bibtex artigo && pdflatex artigo && pdflatex artigo
"""
import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt

import conteudo as C

AQUI = Path(__file__).resolve().parent

LARGURA_TEXTO_CM = 15.0  # A4 com margens laterais de 3,0 cm (modelo da SBC)

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
    r"(\*\*.+?\*\*|`[^`]+`|\{cite:[^}]+\}|\{url:[^}]+\}|\{(?:fig|tab):[^}]+\}|(?<![\w*])\*[^*\s][^*]*?\*(?![\w*]))"
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
# LaTeX (modelo oficial da SBC)
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
    saida = []
    for p in TOKEN.split(texto):
        if not p:
            continue
        if p.startswith("**"):
            saida.append(r"\textbf{" + tex_inline(p[2:-2]) + "}")
        elif p.startswith("`"):
            saida.append(tex_code(p[1:-1]))
        elif p.startswith("{cite:"):
            saida.append(r"\cite{" + p[6:-1] + "}")
        elif p.startswith("{url:"):
            saida.append(r"\url{" + p[5:-1] + "}")
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
    add(r"""% Relatório do Trabalho Prático (Etapa 2) — Locadora de Veículos.
% Formatação: modelo oficial da SBC (sbc-template.sty e sbc.bst, nesta pasta).
% Compilação:  pdflatex artigo && bibtex artigo && pdflatex artigo && pdflatex artigo
% Este arquivo é gerado por gerar_artigo.py a partir de conteudo.py.
\documentclass[12pt]{article}

\usepackage{sbc-template}
\usepackage{graphicx,url}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[brazilian]{babel}
\usepackage{array}
\usepackage{float}

\sloppy
\raggedbottom  % evita esticar títulos e parágrafos quando uma figura não cabe no fim da página
""")
    add("\\title{" + tex_escape(C.TITULO) + "}")
    add("\\author{" + tex_escape(C.AUTOR) + "\\inst{1}}")
    add("\\address{" + tex_escape(C.INSTITUICAO) + "\\\\\n  Disciplina: " + tex_escape(C.DISCIPLINA) + "\n  \\email{" + tex_escape(C.EMAIL) + "}\n}")
    add("\n\\begin{document}\n\n\\maketitle\n")
    add("\\begin{abstract}\n  " + tex_escape(C.ABSTRACT) + "\n  \\textbf{Keywords:} " + tex_escape(C.KEYWORDS) + ".\n\\end{abstract}\n")
    add("\\begin{resumo}\n  " + tex_escape(C.RESUMO) + "\n  \\textbf{Palavras-chave:} " + tex_escape(C.PALAVRAS_CHAVE) + ".\n\\end{resumo}\n")

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
            add("\\begin{figure}[H]\n  \\centering\n  \\includegraphics[width=" + f"{min(larg, 14.4)}cm" + "]{imagens/" + arq + "}\n  \\caption{" + tex_inline(legenda)
                + "}\n  \\label{fig:" + chave + "}\n\\end{figure}\n")
        elif tipo == "tab":
            _, chave, legenda, cab, linhas, larguras = b
            # p{} não inclui o espaçamento interno (2 x 6 pt por coluna) nem os filetes: reserva-se esse espaço.
            disponivel = LARGURA_TEXTO_CM - len(larguras) * 0.45 - 0.2
            fator = disponivel / sum(larguras)
            colunas = "|".join(r">{\raggedright\arraybackslash}p{" + f"{w * fator:.2f}cm" + "}" for w in larguras)
            corpo = ["\\hline", " & ".join(r"\textbf{" + tex_inline(c) + "}" for c in cab) + " \\\\ \\hline"]
            for linha in linhas:
                corpo.append(" & ".join(tex_inline(c) for c in linha) + " \\\\ \\hline")
            add("\\begin{table}[H]\n  \\centering\n  \\caption{" + tex_inline(legenda) + "}\n  \\label{tab:" + chave + "}\n  \\small\n  \\begin{tabular}{|" + colunas
                + "|}\n  " + "\n  ".join(corpo) + "\n  \\end{tabular}\n\\end{table}\n")
        elif tipo == "code":
            add("{\\scriptsize\n\\begin{verbatim}\n" + b[1] + "\n\\end{verbatim}\n}\n")

    add("\\bibliographystyle{sbc}\n\\bibliography{referencias}\n\n\\end{document}\n")
    return "\n".join(L)


def gerar_bib() -> str:
    saida = ["% Referências do relatório (documentações oficiais e a tese de Fielding)."]
    for k in sorted(citadas):
        rot, _completa, campos = C.REFERENCIAS[k]
        if k == "fielding":
            saida.append(
                "@phdthesis{fielding,\n  author = {Fielding, Roy Thomas},\n  title = {{Architectural Styles and the Design of Network-based Software Architectures}},\n"
                "  school = {University of California, Irvine},\n  year = {2000},\n  type = {Tese (Doutorado)}\n}"
            )
            continue
        campos = dict(campos)
        campos.setdefault("year", rot.split(" ")[-1])
        # Chaves duplas preservam a capitalização do título (o estilo sbc.bst coloca títulos em minúsculas).
        linhas = ",\n".join(f"  {n} = {{{{{v}}}}}" if n == "title" else f"  {n} = {{{v}}}" for n, v in campos.items())
        saida.append(f"@misc{{{k},\n{linhas}\n}}")
    return "\n\n".join(saida) + "\n"


# ----------------------------------------------------------------------------------------------
# DOCX (mesmas medidas do modelo da SBC: A4, margens 3,5/2,5/3,0/3,0 cm, Times 12, sem numeração de página)
# ----------------------------------------------------------------------------------------------
FONTE = "Times New Roman"
FONTE_LEGENDA = "Arial"


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


def runs(par, texto, tam=None, negrito=False, italico=False, nome=FONTE):
    for p in TOKEN.split(texto):
        if not p:
            continue
        if p.startswith("**"):
            runs(par, p[2:-2], tam, True, italico, nome)
        elif p.startswith("`"):
            r = par.add_run(p[1:-1])
            set_fonte(r, (tam or 12) - 1.5, nome="Consolas", negrito=negrito, italico=italico)
        elif p.startswith("{cite:"):
            rotulos = [rotulo_cit[k] for k in p[6:-1].split(",")]
            r = par.add_run("[" + "; ".join(rotulos) + "]")
            set_fonte(r, tam, nome, negrito, italico)
        elif p.startswith("{url:"):
            r = par.add_run(p[5:-1])
            set_fonte(r, tam, nome="Courier New", negrito=negrito, italico=italico)
        elif p.startswith("{fig:"):
            r = par.add_run(f"Figura {figuras[p[5:-1]]}")
            set_fonte(r, tam, nome, negrito, italico)
        elif p.startswith("{tab:"):
            r = par.add_run(f"Tabela {tabelas[p[5:-1]]}")
            set_fonte(r, tam, nome, negrito, italico)
        elif p.startswith("*") and p.endswith("*") and len(p) > 2:
            runs(par, p[1:-1], tam, negrito, True, nome)
        else:
            r = par.add_run(aspas(p))
            set_fonte(r, tam, nome, negrito, italico)


def paragrafo(doc, texto="", alinhamento=WD_ALIGN_PARAGRAPH.JUSTIFY, recuo=None, tam=None, antes=0, depois=0, manter=False):
    par = doc.add_paragraph()
    par.alignment = alinhamento
    pf = par.paragraph_format
    pf.space_before, pf.space_after = Pt(antes), Pt(depois)
    pf.first_line_indent = Cm(recuo) if recuo is not None else None
    pf.keep_with_next = manter
    if texto:
        runs(par, texto, tam)
    return par


def gerar_docx(caminho: Path):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Cm(21.0), Cm(29.7)
    sec.left_margin = sec.right_margin = Cm(3.0)
    sec.top_margin, sec.bottom_margin = Cm(3.5), Cm(2.5)

    estilo_fonte(doc.styles["Normal"], 12)
    for nome, tam in (("Heading 1", 13), ("Heading 2", 12)):
        est = doc.styles[nome]
        estilo_fonte(est, tam, negrito=True)
        est.paragraph_format.keep_with_next = True
        est.paragraph_format.space_before = Pt(12)
        est.paragraph_format.space_after = Pt(0)
        est.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    core = doc.core_properties
    core.title, core.author, core.subject, core.language = C.TITULO, C.AUTOR, "Trabalho Prático — Etapa 2", "pt-BR"

    # Primeira página: título 16 pt negrito, autor 12 pt negrito, instituição 12 pt e e-mail em Courier 10 pt
    t = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, antes=12, depois=6)
    set_fonte(t.add_run(C.TITULO), 16, negrito=True)
    a = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, depois=6)
    set_fonte(a.add_run(C.AUTOR), 12, negrito=True)
    for linha in (C.INSTITUICAO, "Disciplina: " + C.DISCIPLINA):
        p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER)
        set_fonte(p.add_run(linha), 12)
    e = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, antes=6, depois=6)
    set_fonte(e.add_run(C.EMAIL), 10, nome="Courier New")

    for rotulo, texto, chaves, rotulo_chaves in (
        ("Abstract.", C.ABSTRACT, C.KEYWORDS, "Keywords: "),
        ("Resumo.", C.RESUMO, C.PALAVRAS_CHAVE, "Palavras-chave: "),
    ):
        p = paragrafo(doc, antes=6)
        p.paragraph_format.left_indent = p.paragraph_format.right_indent = Cm(0.8)
        set_fonte(p.add_run(rotulo + " "), 12, negrito=True, italico=True)
        set_fonte(p.add_run(texto + " "), 12, italico=True)
        set_fonte(p.add_run(rotulo_chaves), 12, negrito=True, italico=True)
        set_fonte(p.add_run(chaves + "."), 12, italico=True)

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
            paragrafo(doc, b[1], recuo=1.27, antes=6)
        elif tipo in ("ul", "ol"):
            for i, item in enumerate(b[1], 1):
                p = paragrafo(doc, antes=3)
                p.paragraph_format.left_indent = Cm(1.27)
                p.paragraph_format.first_line_indent = Cm(-0.6)
                runs(p, ("• " if tipo == "ul" else f"{i}. ") + item)
        elif tipo == "fig":
            _, chave, arq, legenda, larg = b
            p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, antes=8, depois=4, manter=True)
            p.add_run().add_picture(str(AQUI / "imagens" / arq), width=Cm(min(larg, 14.4)))
            cap = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, depois=8)
            cap.paragraph_format.left_indent = cap.paragraph_format.right_indent = Cm(0.8)
            set_fonte(cap.add_run(f"Figura {figuras[chave]}. "), 10, nome=FONTE_LEGENDA, negrito=True)
            runs(cap, legenda, 10, negrito=True, nome=FONTE_LEGENDA)
        elif tipo == "tab":
            _, chave, legenda, cab, linhas, larguras = b
            cap = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.CENTER, antes=8, depois=4, manter=True)
            cap.paragraph_format.left_indent = cap.paragraph_format.right_indent = Cm(0.8)
            set_fonte(cap.add_run(f"Tabela {tabelas[chave]}. "), 10, nome=FONTE_LEGENDA, negrito=True)
            runs(cap, legenda, 10, negrito=True, nome=FONTE_LEGENDA)
            fator = LARGURA_TEXTO_CM / sum(larguras)
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
                linha._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
                for i, cel in enumerate(linha.cells):
                    cel.width = Cm(larguras[i] * fator)
                    for p in cel.paragraphs:
                        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                        p.paragraph_format.space_after = Pt(2)
                        p.paragraph_format.space_before = Pt(2)
            tabela.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))
            paragrafo(doc, depois=4)
        elif tipo == "code":
            linhas = b[1].split("\n")
            for i, linha in enumerate(linhas):
                p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.LEFT, manter=i < len(linhas) - 1, antes=6 if i == 0 else 0)
                p.paragraph_format.left_indent = Cm(0.6)
                sombrear(p._p.get_or_add_pPr(), "F1F4F6")
                set_fonte(p.add_run(linha if linha else " "), 9, nome="Consolas")
            paragrafo(doc, depois=4)

    doc.add_paragraph("Referências", style="Heading 1")
    for k in sorted(citadas, key=lambda x: C.REFERENCIAS[x][1].lower()):
        p = paragrafo(doc, alinhamento=WD_ALIGN_PARAGRAPH.LEFT, antes=6)
        p.paragraph_format.left_indent = Cm(0.5)
        p.paragraph_format.first_line_indent = Cm(-0.5)
        set_fonte(p.add_run(f"{rotulo_cit[k]}: "), 12, negrito=True)
        set_fonte(p.add_run(C.REFERENCIAS[k][1]), 12)

    doc.save(str(caminho))


if __name__ == "__main__":
    (AQUI / "artigo.tex").write_text(gerar_tex(), encoding="utf-8")
    (AQUI / "referencias.bib").write_text(gerar_bib(), encoding="utf-8")
    try:
        gerar_docx(AQUI / "artigo.docx")
    except PermissionError:
        raise SystemExit("O arquivo artigo.docx está aberto em outro programa. Feche-o e execute o script novamente.")
    print("Gerados: artigo.tex, referencias.bib e artigo.docx")
    print("Figuras:", len(figuras), "· Tabelas:", len(tabelas), "· Referências citadas:", len(citadas))
