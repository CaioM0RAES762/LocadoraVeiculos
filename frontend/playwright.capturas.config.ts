import { defineConfig } from '@playwright/test';

/**
 * Gera as capturas de tela reais do sistema (API + SQL Server em execução) em docs/evidencias/frontend.
 *   npm run capturas
 * Requer os dados de demonstração (docs/scripts/dados-demonstracao.sql) para telas com conteúdo.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: 'capturas.spec.ts',
  timeout: 120_000,
  workers: 1,
  reporter: 'list',
  outputDir: 'test-results/capturas',
  use: {
    baseURL: 'http://localhost:5173',
    channel: process.env.PW_CHANNEL || undefined,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
