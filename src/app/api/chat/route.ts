import { auth } from "@/auth";
import { streamChat } from "@/lib/oneMinAi";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, conversationId } = (await request.json()) as {
    prompt: string;
    conversationId?: string;
  };

  const stream = await streamChat(prompt, conversationId);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
