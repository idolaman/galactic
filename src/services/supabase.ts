import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { supabaseAuthStorage } from "@/services/auth-storage";

interface SupabaseAuthConfig {
  configured: boolean;
  publishableKey: string;
  url: string;
}

let supabaseClient: SupabaseClient | null = null;

const readEnvValue = (key: string): string => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
};

export const getSupabaseAuthConfig = (): SupabaseAuthConfig => {
  const url = readEnvValue("VITE_SUPABASE_URL");
  const publishableKey = readEnvValue("VITE_SUPABASE_PUBLISHABLE_KEY");

  return {
    configured: Boolean(url && publishableKey),
    publishableKey,
    url,
  };
};

export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) return supabaseClient;

  const config = getSupabaseAuthConfig();
  if (!config.configured) {
    throw new Error(
      "Supabase auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  supabaseClient = createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      persistSession: true,
      storage: supabaseAuthStorage,
    },
  });

  return supabaseClient;
};
