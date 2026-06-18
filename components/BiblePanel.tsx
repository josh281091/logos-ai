"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchPassage, parseReference, CHAPTER_COUNTS } from "@/lib/bible";
import type { BiblePassage, BibleVerse, Translation } from "@/lib/types";
import VerseBlock from "./VerseBlock";

interface Props {
  book: string;
  chapter: number;
  translation: Translation;
  selectedVerse: BibleVerse | null;
  onVerseSelect: (verse: BibleVerse | null) => void;
  onNavigate: (book: string, chapter: number) => void;
}

export default function BiblePanel({
  book, chapter, translation, selectedVerse, onVerseSelect, onNavigate,
}: Props) {
  const [passage, setPassage] = useState<BiblePassage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPassage(book, chapter, translation);
      setPassage(data);
    } catch {
      setError("Passage konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [book, chapter, translation]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseReference(search);
    if (parsed) { onNavigate(parsed.book, parsed.chapter); setSearch(""); }
  };

  const totalChapters = CHAPTER_COUNTS[book] ?? 1;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg">
      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border bg-surface shrink-0">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zur Stelle (z.B. Johannes 3)"
            className="flex-1 text-sm border border-border rounded-xl px-4 py-2.5 bg-surface2 text-ink focus:outline-none focus:border-accent placeholder-muted transition-colors"
          />
          <button type="submit" className="text-sm px-4 py-2.5 bg-accent text-bg rounded-xl font-medium hover:bg-accent/90 transition-colors">
            Los
          </button>
        </form>
      </div>

      {/* Chapter nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface shrink-0">
        <button
          disabled={chapter <= 1}
          onClick={() => onNavigate(book, chapter - 1)}
          className="text-sm text-muted hover:text-accent disabled:opacity-20 transition-colors w-16 text-left"
        >
          ← Zurück
        </button>
        <div className="text-center">
          <h2 className="font-serif font-bold text-ink text-lg leading-tight">
            {passage?.verses[0]?.book_name ?? book} {chapter}
          </h2>
          {passage && <p className="text-xs text-muted">{passage.translation_name}</p>}
        </div>
        <button
          disabled={chapter >= totalChapters}
          onClick={() => onNavigate(book, chapter + 1)}
          className="text-sm text-muted hover:text-accent disabled:opacity-20 transition-colors w-16 text-right"
        >
          Weiter →
        </button>
      </div>

      {/* Selected verse banner */}
      {selectedVerse && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-accent-dim border-b border-accent/20 shrink-0">
          <span className="text-xs text-accent font-medium flex-1">
            Vers {selectedVerse.verse} ausgewählt — KI nutzt diesen als Kontext
          </span>
          <button onClick={() => onVerseSelect(null)} className="text-xs text-muted hover:text-ink">✕</button>
        </div>
      )}

      {/* Verses */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="text-muted text-sm animate-pulse">Lade Bibeltext…</div>
          </div>
        )}
        {error && (
          <div className="mx-4 mt-4 p-4 border border-red-900/50 bg-red-950/30 rounded-xl text-sm text-red-400">
            {error}
          </div>
        )}
        {!loading && !error && passage && (
          <div className="space-y-1 pb-6">
            {passage.verses.map((verse) => (
              <VerseBlock
                key={verse.verse}
                verse={verse}
                isSelected={selectedVerse?.verse === verse.verse}
                onClick={(v) => onVerseSelect(selectedVerse?.verse === v.verse ? null : v)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
