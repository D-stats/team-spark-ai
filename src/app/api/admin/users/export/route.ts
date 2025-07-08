import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all users with their team information
    const users = await prisma.user.findMany({
      where: { organizationId: session.user.organizationId },
      include: {
        teamMemberships: {
          include: {
            team: {
              select: { name: true }
            }
          }
        },
        managedTeams: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Generate CSV content
    const csvHeader = 'Name,Email,Role,Status,Teams,Managed Teams,Created Date,Last Active\n';
    const csvRows = users.map(user => {
      const teams = user.teamMemberships.map(tm => tm.team.name).join(';');
      const managedTeams = user.managedTeams.map(t => t.name).join(';');
      const lastActive = user.lastActiveAt ? user.lastActiveAt.toISOString() : 'Never';
      
      return [
        `"${user.name}"`,
        `"${user.email}"`,
        user.role,
        user.isActive ? 'Active' : 'Inactive',
        `"${teams}"`,
        `"${managedTeams}"`,
        user.createdAt.toISOString(),
        lastActive
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
}