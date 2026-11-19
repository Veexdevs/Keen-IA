/** Tipos do schema do banco, para o cliente do Supabase inferir as linhas. */

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  prefs: unknown;
  locale: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatRow = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  sources: unknown;
  attachments: unknown;
  created_at: string;
};

type Insert<T, R extends keyof T> = Omit<T, R> & Partial<Pick<T, R>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insert<ProfileRow, "created_at" | "updated_at" | "email" | "display_name" | "avatar_url" | "prefs" | "locale">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      chats: {
        Row: ChatRow;
        Insert: Insert<ChatRow, "id" | "title" | "created_at" | "updated_at">;
        Update: Partial<ChatRow>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Insert<MessageRow, "id" | "sources" | "attachments" | "created_at">;
        Update: Partial<MessageRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
