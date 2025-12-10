import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, getUserPermissions } from "./firebase/users";
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

                    // Get user permissions dynamically from role
                    const permissions = await getUserPermissions(user.uid);

                    return {
                        id: user.uid,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        permissions,
                        emailVerified: Boolean(decodedToken.email_verified || false),
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
        maxAge: 30 * 24 * 60 * 60, // 30 days
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

            // Refresh permissions on session update or when trigger is update
            if (trigger === "update" && token.id) {
                const permissions = await getUserPermissions(token.id as string);
                token.permissions = permissions;
                
                // Also refresh role in case it changed
                const userData = await getUserByEmail(token.email as string);
                if (userData) {
                    token.role = userData.role;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.permissions = token.permissions as string[];
                session.user.emailVerified = Boolean(token.emailVerified);
            }
            return session;
        },

        async redirect({ url, baseUrl }) {
            if (url.startsWith("/api/auth/callback")) {
                return `${baseUrl}/customers`;
            }

            if (url.startsWith("/")) return `${baseUrl}${url}`;
            if (url.startsWith(baseUrl)) return url;

            return `${baseUrl}/customers`;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};