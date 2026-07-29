"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">ParcCours</h1>
      <AuthButton />
      {session?.user && (
        <Link
          href="/chat"
          className="rounded-full bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600"
        >
          Commencer l&apos;exercice
        </Link>
      )}
    </div>
  );
}
