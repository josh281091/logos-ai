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
      className={`flex gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
        isSelected
          ? "bg-accent-dim border border-accent/30"
          : "hover:bg-surface2 border border-transparent"
      }`}
    >
      <span className={`shrink-0 text-xs font-mono mt-1 w-5 text-right select-none ${
        isSelected ? "text-accent" : "text-muted"
      }`}>
        {verse.verse}
      </span>
      <p className="font-serif text-[16px] leading-[1.75] text-ink">
        {verse.text.trim()}
      </p>
    </div>
  );
}
