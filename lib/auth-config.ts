import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, getUserPermissions } from "./firebase/firestore";
import { adminAuth } from "./firebase/admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        idToken: { label: "Firebase ID Token", type: "text" },
        otpVerified: { label: "OTP Verified", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.idToken) {
          throw new Error("Email and ID token required");
        }

        // Check if OTP was verified (2FA)
        if (credentials.otpVerified !== "true") {
          throw new Error("OTP verification required");
        }

        try {
          // Verify Firebase ID token
          const decodedToken = await adminAuth.verifyIdToken(credentials.idToken);
          
          if (decodedToken.email !== credentials.email) {
            throw new Error("Token email mismatch");
          }

          // Get user from Firestore (for role & permissions)
          const user = await getUserByEmail(credentials.email);

          if (!user) {
            throw new Error("User not found in database");
          }

          if (!user.active) {
            throw new Error("Account is inactive");
          }

          // Get user permissions
          const permissions = await getUserPermissions(user.uid);

          return {
            id: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions,
            emailVerified: Boolean(decodedToken.email_verified || false), // ✅ Always boolean
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error("Authentication failed");
        }
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
        token.emailVerified = Boolean(user.emailVerified);
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
        session.user.emailVerified = Boolean(token.emailVerified);
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};