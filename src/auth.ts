import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      // Identity scopes only. Calendar is a separate opt-in (#6), kept off the
      // login flow so we stay clear of Google's ~7-day testing-token re-consent.
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    // Render the allowlist hard-bounce as a friendly "not invited" screen.
    error: "/auth/error",
  },
  callbacks: {
    // The gate (#5): a session is only minted for an allowlisted email; anyone
    // else is hard-bounced (returning false redirects to the error page).
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      const invited = await prisma.allowlistEntry.findUnique({
        where: { email },
      });
      if (!invited) return false;

      // First sign-in materializes the Member; later sign-ins refresh profile.
      // (email is citext, so casing never forks a duplicate.)
      await prisma.member.upsert({
        where: { email },
        create: { email, name: user.name, image: user.image },
        update: { name: user.name, image: user.image },
      });
      return true;
    },
    // Enrich the token once, at sign-in (`user` is only set then), so every
    // later request stays stateless — no per-request DB hit.
    async jwt({ token, user }) {
      if (user?.email) {
        const member = await prisma.member.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (member) {
          token.memberId = member.id;
          token.isOwner = member.isOwner;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.memberId =
          typeof token.memberId === "string" ? token.memberId : "";
        session.user.isOwner = token.isOwner === true;
      }
      return session;
    },
  },
});
