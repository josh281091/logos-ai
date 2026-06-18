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
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-accent text-white"
            : "bg-white border border-border text-ink"
        }`}
      >
        {message.content.split("\n").map((line, i) => (
          <p key={i} className={i > 0 ? "mt-2" : ""}>
            {line}
          </p>
        ))}
      </div>

      {/* Citations */}
      {!isUser && message.citations && message.citations.length > 0 && (
        <div className="flex flex-wrap gap-1 max-w-[85%]">
          {message.citations.map((c, i) => (
            <span
              key={i}
              className="text-xs bg-accent-light text-accent border border-accent/20 px-2 py-0.5 rounded-full"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Follow-up suggestions */}
      {!isUser && message.followUps && message.followUps.length > 0 && (
        <div className="flex flex-col gap-1 max-w-[85%] w-full">
          {message.followUps.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUp(q)}
              className="text-left text-xs text-muted hover:text-accent border border-border hover:border-accent/40 rounded px-3 py-1.5 transition-colors bg-white"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
