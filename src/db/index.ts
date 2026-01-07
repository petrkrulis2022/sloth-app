import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Create the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not configured. Database operations will fail."
  );
}

export const db = createClient<Database>(
  supabaseUrl || "",
  supabaseAnonKey || ""
);

// Re-export types for convenience
export * from "./types";
