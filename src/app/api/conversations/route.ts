import { auth } from "@/auth";
import { createConversation } from "@/lib/oneMinAi";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = (await request.json()) as { title: string };
  const uuid = await createConversation(title);

  return Response.json({ uuid });
}
