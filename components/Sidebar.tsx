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

  const toggleBook = (book: string) => {
    setExpandedBook(expandedBook === book ? null : book);
  };

  const chapterCount = (book: string) => CHAPTER_COUNTS[book] ?? 1;

  const BookList = ({ books }: { books: string[] }) => (
    <div>
      {books.map((book) => (
        <div key={book}>
          <button
            onClick={() => toggleBook(book)}
            className={`w-full text-left px-3 py-1.5 text-sm flex justify-between items-center rounded hover:bg-gray-100 transition-colors ${
              currentBook === book ? "text-accent font-medium" : "text-ink"
            }`}
          >
            <span className="truncate">{book}</span>
            <span className="text-muted text-xs ml-1">
              {expandedBook === book ? "▾" : "▸"}
            </span>
          </button>
          {expandedBook === book && (
            <div className="grid grid-cols-5 gap-0.5 px-3 pb-1">
              {Array.from({ length: chapterCount(book) }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  onClick={() => onNavigate(book, ch)}
                  className={`text-xs py-1 rounded text-center transition-colors ${
                    currentBook === book && currentChapter === ch
                      ? "bg-accent text-white"
                      : "hover:bg-accent-light text-muted hover:text-accent"
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
    <aside className="w-[220px] shrink-0 border-r border-border bg-parchment flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h1 className="font-serif text-lg font-bold text-ink tracking-tight">Logos AI</h1>
        <p className="text-xs text-muted mt-0.5">Bibelstudium-Werkzeug</p>
      </div>

      {/* Mode toggle */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex rounded border border-border overflow-hidden text-xs">
          <button
            onClick={() => onModeChange("study")}
            className={`flex-1 py-1.5 transition-colors ${
              mode === "study" ? "bg-accent text-white" : "text-muted hover:bg-gray-100"
            }`}
          >
            Studium
          </button>
          <button
            onClick={() => onModeChange("sermon")}
            className={`flex-1 py-1.5 transition-colors ${
              mode === "sermon" ? "bg-accent text-white" : "text-muted hover:bg-gray-100"
            }`}
          >
            Predigt
          </button>
        </div>
      </div>

      {/* Translation */}
      <div className="px-3 py-2 border-b border-border">
        <label className="text-xs text-muted block mb-1">Übersetzung</label>
        <select
          value={translation}
          onChange={(e) => onTranslationChange(e.target.value as Translation)}
          className="w-full text-xs border border-border rounded px-2 py-1.5 bg-white text-ink focus:outline-none focus:border-accent"
        >
          <option value="schlachter">Schlachter 2000 (DE)</option>
          <option value="luther">Lutherbibel (DE)</option>
          <option value="kjv">King James Version (EN)</option>
          <option value="web">World English Bible (EN)</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs">
        <button
          onClick={() => setTab("books")}
          className={`flex-1 py-2 transition-colors ${
            tab === "books" ? "border-b-2 border-accent text-accent" : "text-muted hover:text-ink"
          }`}
        >
          Bücher
        </button>
        <button
          onClick={() => setTab("sermons")}
          className={`flex-1 py-2 transition-colors ${
            tab === "sermons" ? "border-b-2 border-accent text-accent" : "text-muted hover:text-ink"
          }`}
        >
          Predigten ({sermons.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto py-1">
        {tab === "books" && (
          <>
            <p className="text-xs font-semibold text-muted px-3 py-1.5 uppercase tracking-wide">Altes Testament</p>
            <BookList books={OT} />
            <p className="text-xs font-semibold text-muted px-3 py-1.5 mt-1 uppercase tracking-wide">Neues Testament</p>
            <BookList books={NT} />
          </>
        )}
        {tab === "sermons" && (
          <div className="px-2 py-1">
            {sermons.length === 0 ? (
              <p className="text-xs text-muted px-2 py-4 text-center">
                Noch keine gespeicherten Predigten. Wechsle in den Predigt-Modus.
              </p>
            ) : (
              sermons.map((s) => (
                <div
                  key={s.id}
                  className="border border-border rounded p-2 mb-2 bg-white"
                >
                  <p className="text-sm font-medium text-ink truncate">{s.title}</p>
                  <p className="text-xs text-muted">{s.passage}</p>
                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={() => onLoadSermon(s)}
                      className="text-xs text-accent hover:underline"
                    >
                      Laden
                    </button>
                    <span className="text-muted text-xs">·</span>
                    <button
                      onClick={() => onDeleteSermon(s.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Löschen
                    </button>
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
