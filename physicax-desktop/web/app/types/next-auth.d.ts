import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
      language?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string | null;
    language?: string | null;
  }
}
