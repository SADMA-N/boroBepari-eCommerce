import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createLoginEvent } from "@/db/login-events";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
        console.log("----------------------------------------")
        console.log(`📨 Sending verification email to ${user.email}`)
        console.log(`🔗 Verification Link: ${url}`)
        console.log("----------------------------------------")
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    session: {
        create: {
            before: async (session) => {
                const user = await db.query.user.findFirst({
                    where: eq(schema.user.id, session.userId)
                })
                
                if (!user?.emailVerified) {
                    throw new Error("Please verify your email address before logging in.")
                }
            },
            after: async (session) => {
                await createLoginEvent({
                    userId: session.userId,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent,
                });
            }
        }
    }
  },
  callbacks: {
    session: async ({ session, user }) => {
        const accounts = await db.query.account.findMany({
            where: eq(schema.account.userId, user.id)
        })
        const hasPassword = accounts.some(a => a.providerId === "credential")
        const isSocial = accounts.some(a => a.providerId !== "credential")

        return {
            ...session,
            user: {
                ...session.user,
                hasPassword,
                needsPassword: isSocial && !hasPassword
            }
        }
    }
  }
});