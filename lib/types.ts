/**
 * Keew IA — os tipos que o raciocínio precisa.
 *
 * A interface é uma tela só, então aqui só entra o que o núcleo local, o
 * conhecimento e o motor realmente usam. Nada de configuração, agente ou
 * preferência.
 */

export type Attachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  /** conteúdo textual extraído (pdf, txt, código) */
  text?: string;
  /** data URL, para imagens */
  dataUrl?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Attachment[];
};

export type KnowledgeDoc = {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  source?: string;
  createdAt?: number;
  updatedAt?: number;
  tags?: string[];
};

export type Citation = {
  title: string;
  url?: string;
  snippet?: string;
  kind?: "knowledge" | "web";
};

/** O único nome público de inteligência da Keew. */
export type ProviderKind = "keew";
