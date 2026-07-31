import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await auth();
  // Une session émise avant l'ajout de `googleId` n'a pas d'id exploitable :
  // on la refuse plutôt que d'écrire une ligne orpheline en base.
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await getDb()
    .prepare("SELECT value FROM progress WHERE user_id = ?")
    .bind(session.user.id)
    .first<{ value: string }>();

  return Response.json({ value: row?.value ?? null });
}

export async function POST(request: Request) {
  const session = await auth();
  // Une session émise avant l'ajout de `googleId` n'a pas d'id exploitable :
  // on la refuse plutôt que d'écrire une ligne orpheline en base.
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { value } = (await request.json()) as { value: string };

  await getDb()
    .prepare(
      `INSERT INTO progress (user_id, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .bind(session.user.id, value, new Date().toISOString())
    .run();

  return Response.json({ ok: true });
}
