import { Cache } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { User, Team, Kudos } from '@prisma/client';
import { log, logError } from '@/lib/logger';

// User caching service
export class UserCacheService {
  private cache = new Cache('users', 300); // 5 minutes

  async getUser(userId: string): Promise<User | null> {
    const cached = await this.cache.get<User>(userId);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await this.cache.set(userId, user);
    }

    return user;
  }

  async invalidateUser(userId: string): Promise<void> {
    await this.cache.delete(userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = `by-email:${email}`;
    const cached = await this.cache.get<User>(cacheKey);
    if (cached) return cached;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await this.cache.set(cacheKey, user);
    }

    return user;
  }
}

// Team caching service
export class TeamCacheService {
  private cache = new Cache('teams', 600); // 10 minutes

  async getTeam(teamId: string): Promise<Team | null> {
    const cached = await this.cache.get<Team>(teamId);
    if (cached) return cached;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (team) {
      await this.cache.set(teamId, team);
    }

    return team;
  }

  async getTeamsByOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ teams: Team[]; total: number }> {
    const cacheKey = `org:${organizationId}:${page}:${limit}`;
    const cached = await this.cache.get<{ teams: Team[]; total: number }>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;
    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where: { organizationId },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.team.count({
        where: { organizationId },
      }),
    ]);

    const result = { teams, total };
    await this.cache.set(cacheKey, result);
    return result;
  }

  async invalidateTeam(teamId: string): Promise<void> {
    await this.cache.delete(teamId);
  }

  async invalidateOrganizationTeams(organizationId: string): Promise<void> {
    await this.cache.deletePattern(`org:${organizationId}:*`);
  }
}

// Kudos caching service
export class KudosCacheService {
  private cache = new Cache('kudos', 60); // 1 minute

  async getRecentKudos(limit: number = 10): Promise<Kudos[]> {
    const cacheKey = `recent:${limit}`;
    const cached = await this.cache.get<Kudos[]>(cacheKey);
    if (cached) return cached;

    const kudos = await prisma.kudos.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: true,
        receiver: true,
      },
    });

    await this.cache.set(cacheKey, kudos, 30); // Cache for 30 seconds
    return kudos;
  }

  async getUserKudosCount(userId: string): Promise<{
    given: number;
    received: number;
  }> {
    const cacheKey = `count:${userId}`;
    const cached = await this.cache.get<{ given: number; received: number }>(cacheKey);
    if (cached) return cached;

    const [given, received] = await Promise.all([
      prisma.kudos.count({ where: { senderId: userId } }),
      prisma.kudos.count({ where: { receiverId: userId } }),
    ]);

    const result = { given, received };
    await this.cache.set(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  }

  async invalidateUserKudos(userId: string): Promise<void> {
    await this.cache.delete(`count:${userId}`);
    await this.cache.deletePattern('recent:*');
  }
}

// Export singleton instances
export const userCacheService = new UserCacheService();
export const teamCacheService = new TeamCacheService();
export const kudosCacheService = new KudosCacheService();

// Cache warming utility
export async function warmCache() {
  try {
    // Warm up recent kudos
    await kudosCacheService.getRecentKudos();

    // Warm up active organizations' teams
    const organizations = await prisma.organization.findMany({
      take: 10,
    });

    for (const org of organizations) {
      await teamCacheService.getTeamsByOrganization(org.id);
    }

    log.info('Cache warming completed');
  } catch (error) {
    logError(error as Error, 'warmCache');
  }
}
