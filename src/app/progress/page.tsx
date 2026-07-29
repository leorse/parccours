"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProgressPage() {
  const { status } = useSession();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    (async () => {
      const res = await fetch("/api/progress");
      const { value } = (await res.json()) as { value: string | null };
      setValue(value ?? "");
      setSavedValue(value);
      setLoading(false);
    })();
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);

    const res = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });

    if (!res.ok) {
      setError(`Échec de l'enregistrement (${res.status}) : ${await res.text()}`);
      return;
    }

    setSavedValue(value);
    setSaved(true);
  }

  if (status !== "authenticated" || loading) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-8">
      <h1 className="text-lg font-semibold">Test D1 — avancement</h1>
      <p className="text-sm opacity-70">
        Cette valeur est liée à ton compte Google et devrait être la même sur tous tes appareils.
      </p>

      <p className="text-sm">
        Valeur enregistrée : <span className="font-semibold">{savedValue ?? "(aucune)"}</span>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="Ta valeur..."
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm dark:border-white/[.145] dark:bg-transparent"
        />
        <button
          type="submit"
          className="rounded-full border border-black/[.08] px-4 py-2 text-sm font-medium hover:bg-[#f2f2f2] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
        >
          Enregistrer
        </button>
        {saved && <p className="text-sm text-green-600">Enregistré.</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
