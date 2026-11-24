# Relatório (modelo da SBC)

| Arquivo | Função |
| --- | --- |
| `conteudo.py` | Fonte única do texto, das tabelas, das figuras e das referências |
| `gerar_artigo.py` | Gera `artigo.tex`, `referencias.bib` e `artigo.docx` a partir de `conteudo.py` (requer `python-docx`) |
| `sbc-template.sty`, `sbc.bst` | Modelo da SBC (estilo e estilo bibliográfico), **sem alterações** |
| `artigo.tex`, `referencias.bib` | Fonte LaTeX e bibliografia |
| `artigo.pdf` | Resultado da compilação |
| `artigo.docx` | Versão equivalente para o Word |
| `imagens/` | Figuras (wireframes, capturas reais do sistema, diagrama de arquitetura e modelo conceitual) |

## Compilar

```powershell
python gerar_artigo.py
pdflatex artigo
bibtex artigo
pdflatex artigo
pdflatex artigo
```

Compilado com MiKTeX 25.12 (`pdflatex` e `bibtex`). Os pacotes usados pelo modelo (`caption2`, `titlesec`, `times`, `babel` em português) são instalados pelo MiKTeX na primeira compilação.

## Origem do modelo

`sbc-template.sty` e `sbc.bst` correspondem ao modelo *SBC Conferences Template* (Sociedade Brasileira de Computação), indicado em
<https://www.overleaf.com/latex/templates/sbc-conferences-template/blbxwjwzdngr>. O download direto do projeto no Overleaf exige login; os dois
arquivos foram obtidos de repositórios públicos que espelham o modelo (cópias de dois repositórios independentes são idênticas entre si).
Se preferir os arquivos baixados diretamente do Overleaf, substitua-os nesta pasta e recompile.
