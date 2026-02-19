import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import '@/lib/auth/types';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
    error: '/auth-error',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // On initial sign-in, embed userId and role
        token.userId = user.id as string;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role || 'USER';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        // Check if a user with this email already exists in our DB
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser) {
          // Link Google account to existing user
          user.id = existingUser.id;

          // Update login timestamp
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() },
          });
        } else {
          // New Google user — create in our DB
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              displayName: user.name || undefined,
              avatarUrl: user.image || undefined,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              lastLogin: new Date(),
              role: user.email === 'info@fulluproar.com' ? 'GOD'
                : user.email === 'annika@fulluproar.com' ? 'ADMIN'
                : 'USER',
            },
          });
          user.id = newUser.id;
        }
      }

      if (account?.provider === 'credentials' && user.id) {
        // Update login timestamp for credential logins
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
      }

      return true;
    },
  },
});
