"use client";

/**
 * Ícones da interface — todos do Lucide.
 *
 * O conjunto é do Lucide; aqui só ficam os nomes que o resto do app já usa,
 * para não espalhar `lucide-react` por vinte arquivos. Só a marca da Google
 * (que é desenho de terceiro) e o "enviar cheio" continuam desenhados aqui.
 *
 * O traço padrão é 1.75, que é o mesmo peso que o Lucide usa por omissão.
 */

import {
  ArrowUp,
  AudioLines,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CodeXml,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderClosed,
  Globe,
  LogOut,
  Menu,
  MessageCircle,
  MessagesSquare,
  Moon,
  Paintbrush,
  Paperclip,
  Pencil,
  Play,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  SlidersHorizontal,

  Square,
  Sun,
  SunMedium,
  Trash2,
  User,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";

type P = { size?: number; className?: string; strokeWidth?: number };

const wrap = (Glyph: LucideIcon, size: number, className?: string, strokeWidth = 1.75) => (
  <Glyph size={size} strokeWidth={strokeWidth} className={className} aria-hidden />
);

export const IconMenu = ({ size = 20, className, strokeWidth }: P) =>
  wrap(Menu, size, className, strokeWidth);

export const IconPlus = ({ size = 18, className, strokeWidth }: P) =>
  wrap(Plus, size, className, strokeWidth);

export const IconSend = ({ size = 18, className, strokeWidth }: P) =>
  wrap(ArrowUp, size, className, strokeWidth);

export const IconPaperclip = ({ size = 18, className, strokeWidth }: P) =>
  wrap(Paperclip, size, className, strokeWidth);

export const IconCopy = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Copy, size, className, strokeWidth);

export const IconCheck = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Check, size, className, strokeWidth);

export const IconSpeak = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Volume2, size, className, strokeWidth);

export const IconRefresh = ({ size = 16, className, strokeWidth }: P) =>
  wrap(RefreshCw, size, className, strokeWidth);

export const IconShare = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Share2, size, className, strokeWidth);

export const IconEdit = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Pencil, size, className, strokeWidth);

export const IconTrash = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Trash2, size, className, strokeWidth);

export const IconClose = ({ size = 18, className, strokeWidth }: P) =>
  wrap(X, size, className, strokeWidth);

export const IconLogout = ({ size = 16, className, strokeWidth }: P) =>
  wrap(LogOut, size, className, strokeWidth);

export const IconUser = ({ size = 16, className, strokeWidth }: P) =>
  wrap(User, size, className, strokeWidth);

export const IconEye = ({ size = 17, className, strokeWidth }: P) =>
  wrap(Eye, size, className, strokeWidth);

export const IconEyeOff = ({ size = 17, className, strokeWidth }: P) =>
  wrap(EyeOff, size, className, strokeWidth);

export const IconStop = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Square, size, className, strokeWidth);

export const IconDownload = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Download, size, className, strokeWidth);

export const IconChevron = ({ size = 16, className, strokeWidth }: P) =>
  wrap(ChevronDown, size, className, strokeWidth);

export const IconArrowUp = ({ size = 16, className, strokeWidth }: P) =>
  wrap(ArrowUp, size, className, strokeWidth);

export const IconPlay = ({ size = 16, className, strokeWidth }: P) =>
  wrap(Play, size, className, strokeWidth);

export const IconFile = ({ size = 16, className, strokeWidth }: P) =>
  wrap(FileText, size, className, strokeWidth);

/* ── navegação ─────────────────────────────────────────────────────────── */

export const IconChat = ({ size = 15, className, strokeWidth }: P) =>
  wrap(MessageCircle, size, className, strokeWidth);

export const IconSearch = ({ size = 15, className, strokeWidth }: P) =>
  wrap(Search, size, className, strokeWidth);

export const IconSliders = ({ size = 16, className, strokeWidth }: P) =>
  wrap(SlidersHorizontal, size, className, strokeWidth);

export const IconChevronLeft = ({ size = 14, className, strokeWidth }: P) =>
  wrap(ChevronLeft, size, className, strokeWidth);

export const IconProjects = ({ size = 20, className, strokeWidth }: P) =>
  wrap(FolderClosed, size, className, strokeWidth);

export const IconCode = ({ size = 20, className, strokeWidth }: P) =>
  wrap(CodeXml, size, className, strokeWidth);

export const IconDesigner = ({ size = 20, className, strokeWidth }: P) =>
  wrap(Paintbrush, size, className, strokeWidth);

export const IconProfile = ({ size = 20, className, strokeWidth }: P) =>
  wrap(CircleUserRound, size, className, strokeWidth);

export const IconVoice = ({ size = 20, className, strokeWidth }: P) =>
  wrap(AudioLines, size, className, strokeWidth);

export const IconChatsEmpty = ({ size = 40, className, strokeWidth }: P) =>
  wrap(MessagesSquare, size, className, strokeWidth);

export const IconSlidersLines = ({ size = 22, className, strokeWidth }: P) =>
  wrap(SlidersHorizontal, size, className, strokeWidth);

export const IconSun = ({ size = 18, className, strokeWidth }: P) =>
  wrap(Sun, size, className, strokeWidth);

export const IconMoon = ({ size = 18, className, strokeWidth }: P) =>
  wrap(Moon, size, className, strokeWidth);

export const IconChevronRight = ({ size = 18, className, strokeWidth }: P) =>
  wrap(ChevronRight, size, className, strokeWidth);

export const IconPlug = ({ size = 18, className, strokeWidth }: P) =>
  wrap(Plug, size, className, strokeWidth);

export const IconGlobe = ({ size = 18, className, strokeWidth }: P) =>
  wrap(Globe, size, className, strokeWidth);

export const IconGear = ({ size = 18, className, strokeWidth }: P) =>
  wrap(Settings, size, className, strokeWidth);

export const IconSunRays = ({ size = 18, className, strokeWidth }: P) =>
  wrap(SunMedium, size, className, strokeWidth);

/* ── os dois que não são do Lucide ─────────────────────────────────────── */

/** O "enviar" do composer é cheio, não de traço — o Lucide não tem versão sólida. */
export const IconSendFill = ({ size = 20, className }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path d="M21.7 11.1 3.9 3.2a.9.9 0 0 0-1.2 1.1l2.6 6.6a1 1 0 0 0 .6.6l8 2.3-8 2.3a1 1 0 0 0-.6.6l-2.6 6.6a.9.9 0 0 0 1.2 1.1l17.8-7.9a.9.9 0 0 0 0-1.6Z" />
  </svg>
);

/** A marca de login do Google — desenho de terceiro, colorido, não entra no Lucide. */
export const IconGoogle = ({ size = 16, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.4H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.4v3.1A12 12 0 0 0 12 24Z"
    />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l3.9-3.1Z" />
    <path
      fill="#EA4335"
      d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l3.9 3.1A7.2 7.2 0 0 1 12 4.8Z"
    />
  </svg>
);
