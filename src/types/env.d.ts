/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PERPLEXITY_API_KEY: string;
  readonly VITE_APP_URL: string;
  readonly VITE_DATABASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Extend Window interface for MetaMask ethereum provider
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request?: (...args: unknown[]) => Promise<unknown>;
    on?: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener?: (
      event: string,
      callback: (...args: unknown[]) => void
    ) => void;
  };
}
