"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { exercises } from "@/lib/exercises";

type Message = {
  role: "assistant" | "user";
  content: string;
};

const exercise = exercises[0];

async function streamChatRequest(
  prompt: string,
  conversationId: string | undefined,
  onChunk: (content: string) => void
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, conversationId }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Chat request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const lines = rawEvent.split("\n");
      const eventType = lines.find((l) => l.startsWith("event:"))?.slice(6).trim();
      const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
      if (!dataLine) continue;

      if (eventType === "content") {
        const parsed = JSON.parse(dataLine) as { content: string };
        onChunk(parsed.content);
      }
    }
  }
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationId = useRef<string | undefined>(undefined);
  const started = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || started.current) return;
    started.current = true;

    (async () => {
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: exercise.title }),
      });
      const { uuid } = (await convRes.json()) as { uuid: string };
      conversationId.current = uuid;

      setMessages([{ role: "assistant", content: "" }]);
      setIsStreaming(true);
      await streamChatRequest(exercise.systemPrompt, uuid, (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      });
      setIsStreaming(false);
    })();
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const answer = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: answer }, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    await streamChatRequest(answer, conversationId.current, (chunk) => {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: next[next.length - 1].content + chunk,
        };
        return next;
      });
    });
    setIsStreaming(false);
  }

  if (status !== "authenticated") {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">{exercise.title}</h1>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
              message.role === "assistant"
                ? "self-start bg-black/[.05] dark:bg-white/[.06]"
                : "self-end bg-blue-500 text-white"
            }`}
          >
            {message.content || "…"}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          placeholder="Ta réponse..."
          className="flex-1 rounded-full border border-black/[.08] px-4 py-2 text-sm dark:border-white/[.145] dark:bg-transparent"
        />
        <button
          type="submit"
          disabled={isStreaming}
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium hover:bg-[#f2f2f2] disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
