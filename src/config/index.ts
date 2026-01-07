export * from "./supabase";

// Environment configuration for Sloth.app
export const config = {
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },

  // Perplexity AI configuration
  perplexity: {
    apiKey: import.meta.env.VITE_PERPLEXITY_API_KEY,
    baseUrl: "https://api.perplexity.ai",
  },

  // Application configuration
  app: {
    url: import.meta.env.VITE_APP_URL || "http://localhost:5173",
  },
} as const;

// Validate required environment variables
export function validateConfig(): void {
  const required = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
    "VITE_PERPLEXITY_API_KEY",
  ] as const;

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.warn(
      `Missing environment variables: ${missing.join(
        ", "
      )}. Some features may not work correctly.`
    );
  }
}
