/**
 * Imprime docs/artigo/artigo.html (gerado por docs/artigo/gerar_artigo.py) em PDF A4 com o Chromium/Edge.
 *   npm run artigo:pdf        (defina PW_CHANNEL=msedge para usar o Edge instalado)
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const aqui = dirname(fileURLToPath(import.meta.url));
const pasta = resolve(aqui, '../../docs/artigo');
const navegador = await chromium.launch({ channel: process.env.PW_CHANNEL || undefined });
const pagina = await navegador.newPage();
await pagina.goto(pathToFileURL(resolve(pasta, 'artigo.html')).href);
await pagina.evaluate(() => document.fonts.ready);
await pagina.pdf({
  path: resolve(pasta, 'artigo.pdf'),
  format: 'A4',
  margin: { top: '3cm', bottom: '2.5cm', left: '2.75cm', right: '2.75cm' },
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate:
    '<div style="font-family:Times New Roman,serif;font-size:10px;width:100%;text-align:center"><span class="pageNumber"></span></div>',
  printBackground: true,
});
await navegador.close();
console.log('PDF gerado em docs/artigo/artigo.pdf');
