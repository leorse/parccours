import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// `next-auth/jwt` se contente de ré-exporter `@auth/core/jwt` :
// c'est ce module qu'il faut augmenter pour que le type soit pris en compte.
declare module "@auth/core/jwt" {
  interface JWT {
    /** `sub` Google (account.providerAccountId) — identifiant stable du compte. */
    googleId?: string;
  }
}
