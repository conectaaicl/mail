import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

const DB_PATH = "/var/www/mail/prisma/dev.db"

function getUser(email: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3")
  const db = new Database(DB_PATH, { readonly: true })
  const row = db.prepare("SELECT id, email, name, password FROM User WHERE email = ?").get(email)
  db.close()
  return row as { id: string; email: string; name: string | null; password: string } | undefined
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      if (isOnDashboard) return isLoggedIn
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const user = getUser(credentials.email as string)
          if (!user || !user.password) return null
          const valid = await bcrypt.compare(credentials.password as string, user.password)
          if (!valid) return null
          return { id: user.id, email: user.email, name: user.name ?? "" }
        } catch (e: any) {
          console.error("[auth] error:", e.message)
          return null
        }
      },
    }),
  ],
})
