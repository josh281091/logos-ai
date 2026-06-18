"use client";

import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface Props {
  message: ChatMessageType;
  onFollowUp: (question: string) => void;
}

export default function ChatMessage({ message, onFollowUp }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-accent text-bg font-medium rounded-br-sm"
          : "bg-surface2 text-ink border border-border rounded-bl-sm"
      }`}>
        {message.content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 && line ? "mt-2" : ""}>{line}</p>
        ))}
      </div>

      {!isUser && message.citations && message.citations.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-w-[88%]">
          {message.citations.map((c, i) => (
            <span key={i} className="text-xs bg-accent-dim text-accent border border-accent/20 px-2.5 py-1 rounded-full">
              {c}
            </span>
          ))}
        </div>
      )}

      {!isUser && message.followUps && message.followUps.length > 0 && (
        <div className="flex flex-col gap-1.5 max-w-[88%] w-full">
          {message.followUps.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUp(q)}
              className="text-left text-xs text-muted hover:text-accent border border-border hover:border-accent/40 rounded-xl px-3 py-2 transition-all bg-surface"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
