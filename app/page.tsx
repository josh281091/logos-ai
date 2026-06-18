"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import BiblePanel from "@/components/BiblePanel";
import AIPanel from "@/components/AIPanel";
import type { BibleVerse, SermonDraft, Translation, AppMode } from "@/lib/types";

const SERMONS_KEY = "logos_ai_sermons";

function loadSermons(): SermonDraft[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SERMONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveSermons(sermons: SermonDraft[]) {
  localStorage.setItem(SERMONS_KEY, JSON.stringify(sermons));
}

export default function Home() {
  const [book, setBook] = useState("John");
  const [chapter, setChapter] = useState(1);
  const [translation, setTranslation] = useState<Translation>("schlachter");
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [mode, setMode] = useState<AppMode>("study");
  const [sermons, setSermons] = useState<SermonDraft[]>([]);
  const [activeSermon, setActiveSermon] = useState<SermonDraft | null>(null);
  const [mobileTab, setMobileTab] = useState<"bible" | "ai">("bible");

  useEffect(() => {
    setSermons(loadSermons());
  }, []);

  const handleNavigate = (b: string, ch: number) => {
    setBook(b);
    setChapter(ch);
    setSelectedVerse(null);
  };

  const handleSaveSermon = (draft: Partial<SermonDraft>) => {
    const existing = activeSermon;
    const updated: SermonDraft = {
      id: existing?.id ?? Math.random().toString(36).slice(2),
      title: draft.title ?? existing?.title ?? `${book} ${chapter}`,
      passage: draft.passage ?? existing?.passage ?? `${book} ${chapter}`,
      outline: draft.outline ?? existing?.outline ?? "",
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };
    const newSermons = existing
      ? sermons.map((s) => (s.id === existing.id ? updated : s))
      : [...sermons, updated];
    setSermons(newSermons);
    saveSermons(newSermons);
    setActiveSermon(updated);
  };

  const handleDeleteSermon = (id: string) => {
    const updated = sermons.filter((s) => s.id !== id);
    setSermons(updated);
    saveSermons(updated);
    if (activeSermon?.id === id) setActiveSermon(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-parchment">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block h-full overflow-hidden">
        <Sidebar
          currentBook={book}
          currentChapter={chapter}
          translation={translation}
          mode={mode}
          sermons={sermons}
          onNavigate={handleNavigate}
          onTranslationChange={setTranslation}
          onModeChange={setMode}
          onLoadSermon={(s) => {
            setActiveSermon(s);
            const parts = s.passage.split(" ");
            // passage like "John 3" or "1 Corinthians 13"
            // last token is chapter
            const ch = parseInt(parts[parts.length - 1], 10);
            const bk = parts.slice(0, -1).join(" ");
            if (!isNaN(ch) && bk) handleNavigate(bk, ch);
          }}
          onDeleteSermon={handleDeleteSermon}
        />
      </div>

      {/* Main panels */}
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">
        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex z-10">
          <button
            onClick={() => setMobileTab("bible")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mobileTab === "bible" ? "text-accent border-t-2 border-accent" : "text-muted"
            }`}
          >
            Bibel
          </button>
          <button
            onClick={() => setMobileTab("ai")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mobileTab === "ai" ? "text-accent border-t-2 border-accent" : "text-muted"
            }`}
          >
            KI
          </button>
        </div>

        {/* Bible panel */}
        <div
          className={`${
            mobileTab === "bible" ? "flex" : "hidden"
          } md:flex flex-col flex-1 min-w-0 h-full overflow-hidden pb-12 md:pb-0`}
        >
          <BiblePanel
            book={book}
            chapter={chapter}
            translation={translation}
            selectedVerse={selectedVerse}
            onVerseSelect={setSelectedVerse}
            onNavigate={handleNavigate}
          />
        </div>

        {/* AI panel */}
        <div
          className={`${
            mobileTab === "ai" ? "flex" : "hidden"
          } md:flex flex-col h-full overflow-hidden pb-12 md:pb-0 border-t border-border md:border-t-0`}
          style={{ width: "100%", maxWidth: 380 }}
        >
          <AIPanel
            selectedVerse={selectedVerse}
            currentBook={book}
            currentChapter={chapter}
            mode={mode}
            activeSermon={activeSermon}
            onSaveSermon={handleSaveSermon}
          />
        </div>
      </div>
    </div>
  );
}
