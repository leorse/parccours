const API_BASE = "https://api.1min.ai/api";
const MODEL = "gpt-4o-mini";

function apiKey() {
  const key = process.env.ONE_MIN_AI_API_KEY;
  if (!key) {
    throw new Error("ONE_MIN_AI_API_KEY is not set");
  }
  return key;
}

export async function createConversation(title: string): Promise<string> {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "API-KEY": apiKey(),
    },
    body: JSON.stringify({
      type: "UNIFY_CHAT_WITH_AI",
      title,
      model: MODEL,
    }),
  });

  if (!res.ok) {
    throw new Error(`1min.ai createConversation failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { uuid: string };
  return data.uuid;
}

export async function streamChat(prompt: string, conversationId?: string): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${API_BASE}/chat-with-ai?isStreaming=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "API-KEY": apiKey(),
    },
    body: JSON.stringify({
      type: "UNIFY_CHAT_WITH_AI",
      model: MODEL,
      promptObject: {
        prompt,
        ...(conversationId ? { conversationId } : {}),
        settings: {
          historySettings: {
            historyMessageLimit: 20,
          },
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`1min.ai chat-with-ai failed: ${res.status} ${await res.text()}`);
  }

  return res.body;
}
