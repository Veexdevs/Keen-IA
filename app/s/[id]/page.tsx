import type { Metadata } from "next";

import { SharedView } from "@/components/shared-view";
import { readShared } from "@/lib/share";

/**
 * /s/[id] — uma resposta da IA numa página só dela.
 *
 * Server Component: o texto vem do banco antes de a página sair, então o link
 * abre para quem não tem conta, sem JavaScript e com prévia decente quando é
 * colado num chat. Nada aqui pede sessão.
 *
 * `export const dynamic` fica em "force-dynamic" porque a resposta é pública e
 * pode ser apagada; um cache de build guardaria o texto mesmo depois disso.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const answer = await readShared(id);
  if (!answer) return { title: "Keen IA", robots: { index: false } };

  /* a prévia de link mostra o começo da resposta, sem markdown */
  const plain = answer.text.replace(/[*_`#>~]/g, "").replace(/\s+/g, " ").trim();
  const description = plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
  return {
    title: answer.title || "Keen IA",
    description,
    robots: { index: false, follow: false },
    openGraph: { title: answer.title || "Keen IA", description, type: "article" },
    twitter: { card: "summary", title: answer.title || "Keen IA", description },
  };
}

export default async function SharedAnswerPage({ params }: Props) {
  const { id } = await params;
  const answer = await readShared(id);
  return <SharedView answer={answer} />;
}
