import { defineConfig } from '@playwright/test';

/**
 * Testes ponta a ponta contra a API e o SQL Server REAIS (sem mocks).
 *
 * Pré-requisitos: banco migrado e API em execução em http://localhost:5000 (dotnet run).
 * O servidor do Vite é iniciado automaticamente (ou reaproveitado) com o proxy de /api.
 *
 * Navegador: por padrão usa o Chromium do Playwright (npx playwright install chromium).
 * Para usar um navegador já instalado, defina PW_CHANNEL=msedge (ou chrome).
 */
export default defineConfig({
  testDir: 'e2e',
  testIgnore: 'capturas.spec.ts',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    channel: process.env.PW_CHANNEL || undefined,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
