import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string; // Dynamic role name
      permissions: string[];
      emailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string; // Dynamic role name
    permissions: string[];
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string; // Dynamic role name
    permissions: string[];
    emailVerified: boolean;
  }
}