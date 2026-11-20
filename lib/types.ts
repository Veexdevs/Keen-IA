/**
 * Keen IA — os tipos que o raciocínio precisa.
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

/** O único nome público de inteligência da Keen. */
export type ProviderKind = "keew";

/** What the local reasoning core returns for a single request. */
export type EngineResult = {
  /** which skill answered: math, units, datetime, text, knowledge, plan, list, social, fallback */
  skill: string;
  /** true when the answer is complete and needs no language engine */
  terminal: boolean;
  /** 0–1; below 0.8 the route prefers the engine when one is connected */
  confidence: number;
  /** the path taken, kept for auditability */
  reasoning: string;
  /** the markdown answer shown to the user */
  answer: string;
};
