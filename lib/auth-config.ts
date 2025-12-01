import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, getUserPermissions } from "./firebase/firestore";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otpVerified: { label: "OTP Verified", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Check if OTP was verified (2FA)
        if (credentials.otpVerified !== "true") {
          throw new Error("Email verification required");
        }

        const user = await getUserByEmail(credentials.email);

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (!user.active) {
          throw new Error("Account is inactive");
        }

        // Verify password
        const passwordDoc = await require("./firebase/admin").adminDb
          .collection("users")
          .doc(user.uid)
          .get();

        const passwordHash = passwordDoc.data()?.passwordHash;

        if (!passwordHash) {
          throw new Error("Password not set");
        }

        const isValid = await bcrypt.compare(credentials.password, passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Get user permissions
        const permissions = await getUserPermissions(user.uid);

        return {
          id: user.uid,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions,
          emailVerified: user.emailVerified, // FIX: Ensure boolean type
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days (for remember me)
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.emailVerified = Boolean(user.emailVerified); // FIX: Ensure boolean
      }

      // Refresh permissions on session update
      if (trigger === "update" && token.id) {
        const permissions = await getUserPermissions(token.id as string);
        token.permissions = permissions;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.emailVerified = Boolean(token.emailVerified); // FIX: Ensure boolean
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};