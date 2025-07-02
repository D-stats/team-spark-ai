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
      jobTitle?: string;
      department?: string;
      bio?: string;
      skills?: string[];
      timezone?: string;
      phoneNumber?: string;
      linkedinUrl?: string;
      twitterUrl?: string;
      githubUrl?: string;
      personalWebsite?: string;
      startDate?: string;
      locale?: string;
      notificationSettings?: any;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    role: string;
    avatarUrl?: string;
    jobTitle?: string;
    department?: string;
    bio?: string;
    skills?: string[];
    timezone?: string;
    phoneNumber?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    githubUrl?: string;
    personalWebsite?: string;
    startDate?: string;
    locale?: string;
    notificationSettings?: any;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    organizationId: string;
    role: string;
    avatarUrl?: string;
    jobTitle?: string;
    department?: string;
    bio?: string;
    skills?: string[];
    timezone?: string;
    phoneNumber?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    githubUrl?: string;
    personalWebsite?: string;
    startDate?: string;
    locale?: string;
    notificationSettings?: any;
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
            jobTitle: user.jobTitle ?? undefined,
            department: user.department ?? undefined,
            bio: user.bio ?? undefined,
            skills: user.skills ?? undefined,
            timezone: user.timezone ?? undefined,
            phoneNumber: user.phoneNumber ?? undefined,
            linkedinUrl: user.linkedinUrl ?? undefined,
            twitterUrl: user.twitterUrl ?? undefined,
            githubUrl: user.githubUrl ?? undefined,
            personalWebsite: user.personalWebsite ?? undefined,
            startDate: user.startDate?.toISOString() ?? undefined,
            locale: user.locale ?? undefined,
            notificationSettings: user.notificationSettings ?? undefined,
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
        token.jobTitle = user.jobTitle;
        token.department = user.department;
        token.bio = user.bio;
        token.skills = user.skills;
        token.timezone = user.timezone;
        token.phoneNumber = user.phoneNumber;
        token.linkedinUrl = user.linkedinUrl;
        token.twitterUrl = user.twitterUrl;
        token.githubUrl = user.githubUrl;
        token.personalWebsite = user.personalWebsite;
        token.startDate = user.startDate;
        token.locale = user.locale;
        token.notificationSettings = user.notificationSettings;
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
          jobTitle: token.jobTitle,
          department: token.department,
          bio: token.bio,
          skills: token.skills,
          timezone: token.timezone,
          phoneNumber: token.phoneNumber,
          linkedinUrl: token.linkedinUrl,
          twitterUrl: token.twitterUrl,
          githubUrl: token.githubUrl,
          personalWebsite: token.personalWebsite,
          startDate: token.startDate,
          locale: token.locale,
          notificationSettings: token.notificationSettings,
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
