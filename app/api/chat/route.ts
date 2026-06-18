import { NextRequest } from "next/server";

const THEOLOGIAN_SYSTEM = `Antworte immer auf Deutsch. You are an expert theologian and biblical scholar with deep knowledge of church history, Greek/Hebrew exegesis, patristic writings, and multiple theological traditions (Lutheran, Reformed, Catholic, Orthodox). When answering, always cite your sources (church fathers, commentaries, manuscript traditions). Be precise but accessible. Never speculate without flagging it clearly.

When providing analysis:
- Cite specific church fathers, councils, or commentaries in parentheses, e.g. (Augustine, City of God 14.28) or (Calvin, Institutes 2.1.5)
- Reference original language where relevant, e.g. the Greek ἀγάπη (agape) vs φιλία (philia)
- Note significant manuscript variants when they affect interpretation
- After your main answer, include a section titled "Follow-up questions to consider:" with 2-3 questions beginning with "What" or "How" or "Why" to deepen study`;

const SERMON_SYSTEM = `Antworte immer auf Deutsch. You are an expert homiletics coach and biblical scholar helping a preacher develop a sermon. You combine theological depth with practical preaching wisdom. When creating sermon outlines:
- Structure with clear Introduction, 3 main points (each with a memorable phrase), Application, and Conclusion
- Ground each point in the text with specific verse references
- Suggest illustrations or contemporary applications
- Note key Greek/Hebrew words that illuminate the passage
- Cite relevant church fathers or theologians for depth
After the outline, include a section titled "Follow-up questions to consider:" with 2-3 questions about sermon development.`;

export async function POST(req: NextRequest) {
  const { messages, selectedVerse, mode, passage } = await req.json();

  const systemPrompt = mode === "sermon" ? SERMON_SYSTEM : THEOLOGIAN_SYSTEM;

  const contextNote = selectedVerse
    ? `\n\nThe user has selected this specific verse for study: ${selectedVerse}`
    : passage
    ? `\n\nThe user is currently reading: ${passage}`
    : "";

  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt + contextNote },
      ...messages,
    ],
    max_tokens: 2048,
    temperature: 0.7,
    stream: false,
  };

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = await groqRes.json();

  if (!groqRes.ok) {
    console.error("Groq error:", JSON.stringify(json));
    return new Response(JSON.stringify({ error: json }), { status: 500 });
  }

  const text = json.choices?.[0]?.message?.content ?? "";

  // Stream word by word for a nice effect
  const encoder = new TextEncoder();
  const words = text.split(" ");

  const readableStream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < words.length; i++) {
        const chunk = (i === 0 ? "" : " ") + words[i];
        const data = JSON.stringify({ delta: { text: chunk } });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        await new Promise((r) => setTimeout(r, 10));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
