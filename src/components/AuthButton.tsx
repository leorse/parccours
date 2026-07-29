"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">{session.user.name}</span>
        <button
          onClick={() => signOut()}
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]"
    >
      Se connecter avec Google
    </button>
  );
}
