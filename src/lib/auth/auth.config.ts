import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      organizationId: string;
      role: string;
      avatarUrl?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    role: string;
    avatarUrl?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    organizationId: string;
    role: string;
    avatarUrl?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== 'string' || typeof credentials?.password !== 'string') {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { organization: true },
          });

          if (typeof user?.password !== 'string' || user.isActive !== true) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            organizationId: user.organizationId,
            role: user.role,
            avatarUrl: user.avatarUrl ?? undefined,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user != null) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.email === 'string' && typeof token.name === 'string') {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          organizationId: token.organizationId,
          role: token.role,
          avatarUrl: token.avatarUrl,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
