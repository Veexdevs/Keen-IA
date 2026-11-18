/**
 * Cliente Supabase no servidor (Route Handlers e Server Components).
 *
 * Lê a sessão dos cookies da requisição. Usado para saber quem está falando
 * com a API sem confiar em nada que venha do corpo do pedido.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./types";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function supabaseServer() {
  if (!isSupabaseConfigured()) return null;

  const store = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll();
        },
        setAll(list) {
          try {
            for (const { name, value, options } of list) {
              store.set(name, value, options);
            }
          } catch {
            // chamado de um Server Component: o middleware cuida da renovação
          }
        },
      },
    },
  );
}

/** O usuário autenticado nesta requisição, ou null. */
export async function currentUser() {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}
