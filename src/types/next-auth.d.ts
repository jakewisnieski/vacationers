import type { DefaultSession } from "next-auth";

// Surface our Member identity on the session and the JWT (#13), so server
// components and route handlers can read `session.user.memberId` / `isOwner`.
declare module "next-auth" {
  interface Session {
    user: {
      memberId: string;
      isOwner: boolean;
    } & DefaultSession["user"];
  }
}
