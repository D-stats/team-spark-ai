import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
// Login tracking is handled in the track-login API endpoint

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
        twoFactorToken: { label: '2FA Token', type: 'text' },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== 'string' || typeof credentials?.password !== 'string') {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              organizationId: true,
              role: true,
              avatarUrl: true,
              isActive: true,
              twoFactorEnabled: true,
              twoFactorSecret: true,
            },
          });

          if (typeof user?.password !== 'string' || user.isActive !== true) {
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.password);

          if (!isValidPassword) {
            // Note: We can't easily track failed attempts here because we don't have access to request
            // Failed attempts will be tracked in the login page client-side
            return null;
          }

          // Check if 2FA is enabled for this user
          if (user.twoFactorEnabled && user.twoFactorSecret != null) {
            // If 2FA is enabled but no token provided, reject with special error
            if (typeof credentials.twoFactorToken !== 'string') {
              throw new Error('2FA_REQUIRED');
            }

            // Verify 2FA token
            const { authenticator } = await import('otplib');
            const isValidToken = authenticator.verify({
              token: credentials.twoFactorToken,
              secret: user.twoFactorSecret,
            });

            if (!isValidToken) {
              throw new Error('INVALID_2FA_TOKEN');
            }
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
    signIn: '/en/login',
    error: '/en/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
