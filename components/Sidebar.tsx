"use client";

import { useState } from "react";
import { BOOKS_OF_THE_BIBLE, CHAPTER_COUNTS } from "@/lib/bible";
import type { SermonDraft, Translation, AppMode } from "@/lib/types";

interface Props {
  currentBook: string;
  currentChapter: number;
  translation: Translation;
  mode: AppMode;
  sermons: SermonDraft[];
  onNavigate: (book: string, chapter: number) => void;
  onTranslationChange: (t: Translation) => void;
  onModeChange: (m: AppMode) => void;
  onLoadSermon: (s: SermonDraft) => void;
  onDeleteSermon: (id: string) => void;
}

const OT = BOOKS_OF_THE_BIBLE.slice(0, 39);
const NT = BOOKS_OF_THE_BIBLE.slice(39);

export default function Sidebar({
  currentBook, currentChapter, translation, mode, sermons,
  onNavigate, onTranslationChange, onModeChange, onLoadSermon, onDeleteSermon,
}: Props) {
  const [expandedBook, setExpandedBook] = useState<string | null>(currentBook);
  const [tab, setTab] = useState<"books" | "sermons">("books");

  const chapterCount = (book: string) => CHAPTER_COUNTS[book] ?? 1;

  const BookList = ({ books }: { books: string[] }) => (
    <div className="space-y-0.5">
      {books.map((book) => (
        <div key={book}>
          <button
            onClick={() => setExpandedBook(expandedBook === book ? null : book)}
            className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center rounded-lg transition-colors ${
              currentBook === book ? "text-accent bg-accent-dim" : "text-ink hover:bg-surface2"
            }`}
          >
            <span className="truncate">{book}</span>
            <span className="text-muted text-xs ml-1">{expandedBook === book ? "▾" : "▸"}</span>
          </button>
          {expandedBook === book && (
            <div className="grid grid-cols-5 gap-1 px-3 py-2">
              {Array.from({ length: chapterCount(book) }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => onNavigate(book, ch)}
                  className={`text-xs py-1.5 rounded-lg text-center transition-colors ${
                    currentBook === book && currentChapter === ch
                      ? "bg-accent text-bg font-bold"
                      : "hover:bg-surface2 text-muted hover:text-ink"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-surface flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="font-serif text-xl font-bold text-ink tracking-tight">✝ Logos AI</h1>
        <p className="text-xs text-muted mt-0.5">Bibelstudium</p>
      </div>

      {/* Mode */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex rounded-xl border border-border overflow-hidden text-xs">
          <button
            onClick={() => onModeChange("study")}
            className={`flex-1 py-2 transition-colors font-medium ${
              mode === "study" ? "bg-accent text-bg" : "text-muted hover:text-ink hover:bg-surface2"
            }`}
          >
            Studium
          </button>
          <button
            onClick={() => onModeChange("sermon")}
            className={`flex-1 py-2 transition-colors font-medium ${
              mode === "sermon" ? "bg-accent text-bg" : "text-muted hover:text-ink hover:bg-surface2"
            }`}
          >
            Predigt
          </button>
        </div>
      </div>

      {/* Translation */}
      <div className="px-3 py-2.5 border-b border-border">
        <select
          value={translation}
          onChange={(e) => onTranslationChange(e.target.value as Translation)}
          className="w-full text-xs border border-border rounded-lg px-2 py-2 bg-surface2 text-ink focus:outline-none focus:border-accent"
        >
          <option value="schlachter">Schlachter 2000</option>
          <option value="luther">Lutherbibel</option>
          <option value="kjv">King James (EN)</option>
          <option value="web">World English (EN)</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs">
        {(["books", "sermons"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 font-medium transition-colors ${
              tab === t ? "text-accent border-b-2 border-accent" : "text-muted hover:text-ink"
            }`}
          >
            {t === "books" ? "Bücher" : `Predigten (${sermons.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {tab === "books" && (
          <>
            <p className="text-xs font-semibold text-muted px-3 py-2 uppercase tracking-widest">Altes Testament</p>
            <BookList books={OT} />
            <p className="text-xs font-semibold text-muted px-3 py-2 mt-2 uppercase tracking-widest">Neues Testament</p>
            <BookList books={NT} />
          </>
        )}
        {tab === "sermons" && (
          <div className="px-2 py-1 space-y-2">
            {sermons.length === 0 ? (
              <p className="text-xs text-muted px-2 py-6 text-center leading-relaxed">
                Noch keine Predigten gespeichert.
              </p>
            ) : (
              sermons.map((s) => (
                <div key={s.id} className="border border-border rounded-xl p-3 bg-surface2">
                  <p className="text-sm font-medium text-ink truncate">{s.title}</p>
                  <p className="text-xs text-muted mt-0.5">{s.passage}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => onLoadSermon(s)} className="text-xs text-accent hover:underline">Laden</button>
                    <span className="text-muted text-xs">·</span>
                    <button onClick={() => onDeleteSermon(s.id)} className="text-xs text-red-400 hover:underline">Löschen</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
