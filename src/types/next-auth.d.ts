import type { DefaultSession } from "next-auth";

// Surface our Member identity on the session (#13), so server components and
// route handlers can read `session.user.memberId` / `isOwner`. `user` is
// optional: the session callback fails closed and drops the user when the JWT
// carries no resolved Member (#14), so every consumer must null-check.
declare module "next-auth" {
  interface Session {
    user?: {
      memberId: string;
      isOwner: boolean;
    } & DefaultSession["user"];
  }
}
