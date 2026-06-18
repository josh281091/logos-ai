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
      setError("Could not load passage. Please check your connection or try a different reference.");
    } finally {
      setLoading(false);
    }
  }, [book, chapter, translation]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseReference(search);
    if (parsed) {
      onNavigate(parsed.book, parsed.chapter);
      setSearch("");
    }
  };

  const totalChapters = CHAPTER_COUNTS[book] ?? 1;
  const canPrev = chapter > 1;
  const canNext = chapter < totalChapters;

  const handleVerseClick = (verse: BibleVerse) => {
    onVerseSelect(selectedVerse?.verse === verse.verse ? null : verse);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-border">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-parchment shrink-0">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Zur Stelle (z.B. Johannes 3, Römer 8:1)"
            className="flex-1 text-sm border border-border rounded px-3 py-1.5 bg-white focus:outline-none focus:border-accent placeholder-muted"
          />
          <button
            type="submit"
            className="text-sm px-3 py-1.5 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
          >
            Los
          </button>
        </form>
      </div>

      {/* Chapter nav */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-white shrink-0">
        <button
          disabled={!canPrev}
          onClick={() => onNavigate(book, chapter - 1)}
          className="text-sm text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1"
        >
          ← Zurück
        </button>
        <div className="text-center">
          <h2 className="font-serif font-bold text-ink text-base">
            {book} {chapter}
          </h2>
          {passage && (
            <p className="text-xs text-muted">{passage.translation_name}</p>
          )}
        </div>
        <button
          disabled={!canNext}
          onClick={() => onNavigate(book, chapter + 1)}
          className="text-sm text-muted hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1"
        >
          Weiter →
        </button>
      </div>

      {/* Selected verse banner */}
      {selectedVerse && (
        <div className="flex items-center gap-2 px-4 py-2 bg-accent-light border-b border-accent/20 shrink-0">
          <span className="text-xs text-accent font-medium">
            Vers {selectedVerse.verse} ausgewählt — KI nutzt diesen als Kontext
          </span>
          <button
            onClick={() => onVerseSelect(null)}
            className="ml-auto text-xs text-muted hover:text-ink"
          >
            Entfernen ✕
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted text-sm">Lade Bibeltext…</div>
          </div>
        )}
        {error && (
          <div className="mx-4 mt-4 p-3 border border-red-200 bg-red-50 rounded text-sm text-red-600">
            {error}
          </div>
        )}
        {!loading && !error && passage && (
          <div className="space-y-0.5">
            {passage.verses.map((verse) => (
              <VerseBlock
                key={verse.verse}
                verse={verse}
                isSelected={selectedVerse?.verse === verse.verse}
                onClick={handleVerseClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
