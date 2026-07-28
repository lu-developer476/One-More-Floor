/// <reference types="vite/client" />
declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_E2E?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
