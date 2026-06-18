"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import BiblePanel from "@/components/BiblePanel";
import AIPanel from "@/components/AIPanel";
import type { BibleVerse, SermonDraft, Translation, AppMode } from "@/lib/types";

const SERMONS_KEY = "logos_ai_sermons";
function loadSermons(): SermonDraft[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SERMONS_KEY) ?? "[]"); } catch { return []; }
}
function saveSermons(s: SermonDraft[]) { localStorage.setItem(SERMONS_KEY, JSON.stringify(s)); }

type MobileTab = "nav" | "bible" | "ai";

export default function Home() {
  const [book, setBook] = useState("Johannes");
  const [chapter, setChapter] = useState(1);
  const [translation, setTranslation] = useState<Translation>("schlachter");
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [mode, setMode] = useState<AppMode>("study");
  const [sermons, setSermons] = useState<SermonDraft[]>([]);
  const [activeSermon, setActiveSermon] = useState<SermonDraft | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("bible");

  useEffect(() => { setSermons(loadSermons()); }, []);

  const handleNavigate = (b: string, ch: number) => {
    setBook(b);
    setChapter(ch);
    setSelectedVerse(null);
    setMobileTab("bible");
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
    const newSermons = existing ? sermons.map((s) => (s.id === existing.id ? updated : s)) : [...sermons, updated];
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

  const tabs: { id: MobileTab; label: string; icon: string }[] = [
    { id: "nav", label: "Navigation", icon: "☰" },
    { id: "bible", label: "Bibel", icon: "✝" },
    { id: "ai", label: "KI", icon: "✦" },
  ];

  return (
    <div className="flex overflow-hidden bg-bg" style={{height: "100dvh"}}>
      {/* Desktop sidebar */}
      <div className="hidden md:block h-full overflow-hidden shrink-0">
        <Sidebar
          currentBook={book} currentChapter={chapter} translation={translation}
          mode={mode} sermons={sermons}
          onNavigate={handleNavigate}
          onTranslationChange={setTranslation}
          onModeChange={setMode}
          onLoadSermon={(s) => {
            setActiveSermon(s);
            const parts = s.passage.split(" ");
            const ch = parseInt(parts[parts.length - 1], 10);
            const bk = parts.slice(0, -1).join(" ");
            if (!isNaN(ch) && bk) handleNavigate(bk, ch);
          }}
          onDeleteSermon={handleDeleteSermon}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex min-w-0 h-full overflow-hidden">

        {/* Mobile: nav panel */}
        <div className={`${mobileTab === "nav" ? "flex" : "hidden"} md:hidden flex-col w-full h-full overflow-hidden`}>
          <Sidebar
            currentBook={book} currentChapter={chapter} translation={translation}
            mode={mode} sermons={sermons}
            onNavigate={handleNavigate}
            onTranslationChange={setTranslation}
            onModeChange={setMode}
            onLoadSermon={(s) => { setActiveSermon(s); setMobileTab("bible"); }}
            onDeleteSermon={handleDeleteSermon}
          />
        </div>

        {/* Bible panel */}
        <div className={`${mobileTab === "bible" ? "flex" : "hidden"} md:flex flex-col flex-1 min-w-0 overflow-hidden`} style={{height: "calc(100dvh - 56px)"}}>
          <BiblePanel
            book={book} chapter={chapter} translation={translation}
            selectedVerse={selectedVerse}
            onVerseSelect={(v) => { setSelectedVerse(v); if (v) setMobileTab("ai"); }}
            onNavigate={handleNavigate}
          />
        </div>

        {/* AI panel */}
        <div className={`${mobileTab === "ai" ? "flex" : "hidden"} md:flex flex-col overflow-hidden w-full md:w-auto`} style={{height: "calc(100dvh - 56px)"}}>
          <AIPanel
            selectedVerse={selectedVerse}
            currentBook={book} currentChapter={chapter}
            mode={mode} activeSermon={activeSermon}
            onSaveSermon={handleSaveSermon}
          />
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex z-20 safe-bottom">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setMobileTab(t.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-colors ${
              mobileTab === t.id ? "text-accent" : "text-muted"
            }`}
          >
            <span className="text-base">{t.icon}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
