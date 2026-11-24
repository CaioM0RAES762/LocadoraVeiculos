/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API. Vazio = usa o proxy do Vite em /api. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
