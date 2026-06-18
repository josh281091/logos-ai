"use client";

import type { BibleVerse } from "@/lib/types";

interface Props {
  verse: BibleVerse;
  isSelected: boolean;
  onClick: (verse: BibleVerse) => void;
}

export default function VerseBlock({ verse, isSelected, onClick }: Props) {
  return (
    <div
      onClick={() => onClick(verse)}
      className={`group flex gap-3 px-3 py-2 rounded cursor-pointer transition-colors ${
        isSelected
          ? "bg-accent-light border-l-2 border-accent"
          : "hover:bg-gray-50 border-l-2 border-transparent"
      }`}
    >
      <span
        className={`shrink-0 text-xs font-mono mt-0.5 w-6 text-right select-none ${
          isSelected ? "text-accent font-bold" : "text-muted"
        }`}
      >
        {verse.verse}
      </span>
      <p className="font-serif text-[15px] leading-relaxed text-ink">
        {verse.text.trim()}
      </p>
    </div>
  );
}
