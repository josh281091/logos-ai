export type Translation = "kjv" | "web" | "schlachter" | "luther";

export interface BibleVerse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BiblePassage {
  reference: string;
  verses: BibleVerse[];
  text: string;
  translation_id: string;
  translation_name: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  followUps?: string[];
  timestamp: number;
}

export interface SermonDraft {
  id: string;
  title: string;
  passage: string;
  outline: string;
  createdAt: number;
  updatedAt: number;
}

export type AppMode = "study" | "sermon";

export interface AppState {
  book: string;
  chapter: number;
  translation: Translation;
  selectedVerse: BibleVerse | null;
  mode: AppMode;
}
