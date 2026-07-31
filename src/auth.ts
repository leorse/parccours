import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, account }) {
      // `account` n'est présent qu'au tout premier appel, juste après la connexion.
      // On y capture le `sub` Google (providerAccountId), seul identifiant stable
      // du compte : Auth.js régénère volontairement `user.id` — et donc `token.sub` —
      // à chaque connexion, ce qui créerait une ligne en base par login/appareil.
      if (account?.providerAccountId) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.googleId) {
        session.user.id = token.googleId;
      }
      return session;
    },
  },
});
