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

function generateId() { return Math.random().toString(36).slice(2, 10); }

function parseCitationsFromText(text: string): string[] {
  const citations: string[] = [];
  const paren = text.match(/\(([^)]{5,80})\)/g);
  if (paren) paren.slice(0, 5).forEach((c) => citations.push(c.replace(/[()]/g, "")));
  return Array.from(new Set(citations));
}

function parseFollowUps(text: string): string[] {
  const lines = text.split("\n");
  const followUps: string[] = [];
  let inSection = false;
  for (const line of lines) {
    if (/follow.?up|further study|consider|explore|Folgefragen|Weiterführend/i.test(line)) { inSection = true; continue; }
    if (inSection && /^[-•*]\s+.+\?/.test(line.trim())) followUps.push(line.replace(/^[-•*]\s+/, "").trim());
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (activeSermon) { setSermonTitle(activeSermon.title); setSermonOutline(activeSermon.outline); } }, [activeSermon]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { id: generateId(), role: "user", content: text.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
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
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "", timestamp: Date.now() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.delta?.text ?? "";
              fullText += delta;
              setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m));
            } catch { /* skip */ }
          }
        }
      }

      const citations = parseCitationsFromText(fullText);
      const followUps = parseFollowUps(fullText);
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, citations, followUps } : m));
      if (mode === "sermon" && !sermonOutline && fullText.length > 100) setSermonOutline(fullText);
    } catch {
      setMessages((prev) => [...prev, { id: generateId(), role: "assistant", content: "Fehler beim Verbinden mit der KI. Bitte API-Schlüssel prüfen.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSermonPrompt = () => {
    const verseCtx = selectedVerse ? ` mit Fokus auf Vers ${selectedVerse.verse}: "${selectedVerse.text.trim()}"` : "";
    sendMessage(`Erstelle eine Predigtgliederung für ${currentBook} ${currentChapter}${verseCtx}. Mit Einleitung, 3 Hauptpunkten mit einprägsamen Titeln, Anwendung und Schluss.`);
  };

  return (
    <div className="w-full md:w-[380px] shrink-0 flex flex-col h-full bg-surface border-l border-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-ink">
              {mode === "sermon" ? "✦ Predigtvorbereitung" : "✦ KI-Theologe"}
            </h3>
            <p className="text-xs text-muted mt-0.5">
              {selectedVerse
                ? `Kontext: ${selectedVerse.book_name} ${selectedVerse.chapter}:${selectedVerse.verse}`
                : "Vers anklicken für Kontext"}
            </p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} className="text-xs text-muted hover:text-ink border border-border rounded-lg px-2 py-1 transition-colors">
              Leeren
            </button>
          )}
        </div>
      </div>

      {/* Sermon controls */}
      {mode === "sermon" && (
        <div className="px-3 py-3 border-b border-border bg-bg shrink-0 space-y-2">
          <input
            type="text"
            value={sermonTitle}
            onChange={(e) => setSermonTitle(e.target.value)}
            placeholder="Predigttitel…"
            className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-surface2 text-ink focus:outline-none focus:border-accent placeholder-muted"
          />
          <div className="flex gap-2">
            <button onClick={handleSermonPrompt} className="flex-1 text-xs bg-accent text-bg rounded-xl py-2.5 font-medium hover:bg-accent/90 transition-colors">
              Gliederung erstellen
            </button>
            <button
              onClick={() => onSaveSermon({ title: sermonTitle || `${currentBook} ${currentChapter}`, passage: `${currentBook} ${currentChapter}`, outline: sermonOutline })}
              className="flex-1 text-xs border border-accent/40 text-accent rounded-xl py-2.5 font-medium hover:bg-accent-dim transition-colors"
            >
              Speichern
            </button>
          </div>
          {sermonOutline && (
            <textarea
              value={sermonOutline}
              onChange={(e) => setSermonOutline(e.target.value)}
              rows={5}
              className="w-full text-xs border border-border rounded-xl px-3 py-2 bg-surface2 text-ink focus:outline-none focus:border-accent resize-none font-mono"
            />
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-10 px-2">
            <p className="text-3xl mb-3">✝</p>
            <p className="text-sm font-semibold text-ink">Frag den KI-Theologen</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              {mode === "study"
                ? "Wähle einen Vers und frage nach Bedeutung, Geschichte oder Theologie."
                : "Wähle eine Stelle und erstelle eine Predigtgliederung."}
            </p>
            <div className="mt-5 space-y-2">
              {[
                "Was ist der historische Kontext dieser Stelle?",
                "Was sagen die Kirchenväter dazu?",
                "Erkläre die griechischen/hebräischen Originalwörter",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="block w-full text-left text-xs border border-border rounded-xl px-3 py-2.5 hover:border-accent/50 hover:text-accent text-muted transition-all bg-surface2"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessageComponent key={msg.id} message={msg} onFollowUp={sendMessage} />
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="bg-surface2 border border-border rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-muted">
              <span className="animate-pulse">Denke nach…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border shrink-0 safe-bottom">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Frage zu dieser Stelle…"
            className="flex-1 text-sm border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent disabled:opacity-50 bg-surface2 text-ink placeholder-muted transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="shrink-0 w-11 h-11 bg-accent text-bg rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-accent/90 transition-colors font-bold text-lg"
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}
