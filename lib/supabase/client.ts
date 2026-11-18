"use client";

/**
 * Cliente Supabase no navegador.
 *
 * A sessão é guardada em cookies pelo @supabase/ssr, para que o servidor
 * também consiga ler quem está logado. Sem as variáveis de ambiente o app
 * continua funcionando — só que em modo convidado, com os dados locais.
 */
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./types";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function supabaseBrowser() {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cached;
}
