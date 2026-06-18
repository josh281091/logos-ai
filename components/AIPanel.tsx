"use client";

import { useState, useRef, useEffect } from "react";
import type { BibleVerse, ChatMessage, SermonDraft, AppMode } from "@/lib/types";
import ChatMessageComponent from "./ChatMessage";

interface Props {
  selectedVerse: BibleVerse | null;
  currentBook: string;
  currentChapter: number;
  mode: AppMode;
  activeSermon: SermonDraft | null;
  onSaveSermon: (draft: Partial<SermonDraft>) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function parseCitationsFromText(text: string): string[] {
  const citations: string[] = [];
  // Extract parenthetical references like (John 3:16), (Calvin, Institutes 1.2), etc.
  const paren = text.match(/\(([^)]{5,80})\)/g);
  if (paren) {
    citations.push(...paren.slice(0, 5).map((c) => c.replace(/[()]/g, "")));
  }
  return [...new Set(citations)];
}

function parseFollowUps(text: string): string[] {
  const lines = text.split("\n");
  const followUps: string[] = [];
  let inSection = false;
  for (const line of lines) {
    if (/follow.?up|further study|consider|explore/i.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^[-•*]\s+.+\?/.test(line.trim())) {
      followUps.push(line.replace(/^[-•*]\s+/, "").trim());
    }
    if (followUps.length >= 3) break;
  }
  return followUps;
}

export default function AIPanel({
  selectedVerse, currentBook, currentChapter, mode, activeSermon, onSaveSermon,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sermonTitle, setSermonTitle] = useState(activeSermon?.title ?? "");
  const [sermonOutline, setSermonOutline] = useState(activeSermon?.outline ?? "");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (activeSermon) {
      setSermonTitle(activeSermon.title);
      setSermonOutline(activeSermon.outline);
    }
  }, [activeSermon]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          selectedVerse: selectedVerse
            ? `${selectedVerse.book_name} ${selectedVerse.chapter}:${selectedVerse.verse} — "${selectedVerse.text.trim()}"`
            : null,
          mode,
          passage: `${currentBook} ${currentChapter}`,
        }),
      });

      if (!res.ok || !res.body) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      const assistantId = generateId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: Date.now() },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.delta?.text ?? parsed.choices?.[0]?.delta?.content ?? "";
              fullText += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullText } : m
                )
              );
            } catch {
              // non-JSON line, skip
            }
          }
        }
      }

      const citations = parseCitationsFromText(fullText);
      const followUps = parseFollowUps(fullText);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, citations, followUps } : m
        )
      );

      // In sermon mode, auto-populate outline
      if (mode === "sermon" && !sermonOutline && fullText.length > 100) {
        setSermonOutline(fullText);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "Fehler beim Verbinden mit der KI. Bitte API-Schlüssel prüfen und erneut versuchen.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSermonPrompt = () => {
    const passage = `${currentBook} ${currentChapter}`;
    const verseCtx = selectedVerse
      ? ` focusing on verse ${selectedVerse.verse}: "${selectedVerse.text.trim()}"`
      : "";
    sendMessage(
      `Please help me structure a sermon outline for ${passage}${verseCtx}. Include: introduction, 3 main points with supporting scripture, application, and conclusion.`
    );
  };

  return (
    <div className="w-[380px] shrink-0 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm text-ink">
              {mode === "sermon" ? "Predigtvorbereitung" : "KI-Theologe"}
            </h3>
            <p className="text-xs text-muted">
              {selectedVerse
                ? `Kontext: ${selectedVerse.book_name} ${selectedVerse.chapter}:${selectedVerse.verse}`
                : "Vers anklicken für Kontext"}
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs text-muted hover:text-ink"
            >
              Leeren
            </button>
          )}
        </div>
      </div>

      {/* Sermon mode controls */}
      {mode === "sermon" && (
        <div className="px-3 py-2 border-b border-border bg-parchment shrink-0 space-y-2">
          <input
            type="text"
            value={sermonTitle}
            onChange={(e) => setSermonTitle(e.target.value)}
            placeholder="Predigttitel…"
            className="w-full text-sm border border-border rounded px-3 py-1.5 bg-white focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSermonPrompt}
              className="flex-1 text-xs bg-accent text-white rounded py-1.5 hover:bg-accent/90 transition-colors"
            >
              Gliederung erstellen
            </button>
            <button
              onClick={() =>
                onSaveSermon({
                  title: sermonTitle || `${currentBook} ${currentChapter}`,
                  passage: `${currentBook} ${currentChapter}`,
                  outline: sermonOutline,
                })
              }
              className="flex-1 text-xs border border-accent text-accent rounded py-1.5 hover:bg-accent-light transition-colors"
            >
              Entwurf speichern
            </button>
          </div>
          {sermonOutline && (
            <textarea
              value={sermonOutline}
              onChange={(e) => setSermonOutline(e.target.value)}
              rows={6}
              placeholder="Predigtgliederung erscheint hier…"
              className="w-full text-xs border border-border rounded px-3 py-2 bg-white focus:outline-none focus:border-accent resize-none font-mono"
            />
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted">
            <p className="text-2xl mb-2">✝</p>
            <p className="text-sm font-medium text-ink">Frag den KI-Theologen</p>
            <p className="text-xs mt-1">
              {mode === "study"
                ? "Wähle einen Vers und frage nach Bedeutung, Geschichte oder Theologie."
                : "Wähle eine Stelle und erstelle eine Predigtgliederung."}
            </p>
            <div className="mt-4 space-y-1.5">
              {[
                "Was ist der historische Kontext dieser Stelle?",
                "Was sagen die Kirchenväter dazu?",
                "Erkläre die griechischen/hebräischen Originalwörter",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="block w-full text-left text-xs border border-border rounded px-3 py-2 hover:border-accent hover:text-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessageComponent
            key={msg.id}
            message={msg}
            onFollowUp={sendMessage}
          />
        ))}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-white border border-border rounded-lg px-4 py-3 text-sm text-muted">
              <span className="animate-pulse">Denke nach…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 px-3 py-2.5 border-t border-border shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Frage zu dieser Stelle…"
          className="flex-1 text-sm border border-border rounded px-3 py-2 focus:outline-none focus:border-accent disabled:opacity-50 bg-white"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="text-sm px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Senden
        </button>
      </form>
    </div>
  );
}
