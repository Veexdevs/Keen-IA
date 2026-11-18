/**
 * Renova a sessão do Supabase a cada requisição.
 *
 * Sem isso, o token expira e o usuário é deslogado no meio do uso. O
 * middleware também devolve os cookies renovados para a resposta.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // sem banco configurado, o app roda em modo convidado
  if (!url || !key) return NextResponse.next();

  const response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        for (const { name, value, options } of list) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // tocar em getUser renova o token quando necessário
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|mark.*svg|og.png|.*\\.(?:png|jpg|svg|ico|webp)$).*)"],
};
