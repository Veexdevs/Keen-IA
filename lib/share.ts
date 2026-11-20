import { createAdminClient } from "./supabase/admin";

export type SharedAnswer = {
  text: string;
  lang: string;
  title: string;
  created_at: string;
};

/** Letras do alfabeto do id, para recusar lixo antes de tocar no banco. */
const ID = /^[a-z2-9]{6,32}$/;

export async function readShared(id: string): Promise<SharedAnswer | null> {
  if (!ID.test(id)) return null;
  const sb = createAdminClient();
  if (!sb) return null;

  try {
    const { data } = await (sb as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: SharedAnswer | null }> };
        };
      };
    })
      .from("shared_answers")
      .select("text,lang,title,created_at")
      .eq("id", id)
      .maybeSingle();
    if (data) return data;
  } catch {
    /* tenta a reserva */
  }

  try {
    const { data } = await (sb as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { value?: SharedAnswer } | null }> };
        };
      };
    })
      .from("app_config")
      .select("value")
      .eq("id", `share:${id}`)
      .maybeSingle();
    return data?.value ?? null;
  } catch {
    return null;
  }
}


