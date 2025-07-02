import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';

interface UpdateProfileData {
  name?: string;
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
  startDate?: string | null;
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const body = await request.json() as UpdateProfileData;
    const {
      name,
      jobTitle,
      department,
      bio,
      skills,
      timezone,
      phoneNumber,
      linkedinUrl,
      twitterUrl,
      githubUrl,
      personalWebsite,
      startDate,
    } = body;

    // Validate required fields
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate URL fields
    const urlFields = { linkedinUrl, twitterUrl, githubUrl, personalWebsite };
    for (const [field, url] of Object.entries(urlFields)) {
      if (url && typeof url === 'string' && url.trim() !== '') {
        try {
          new URL(url);
        } catch {
          return NextResponse.json({ error: `Invalid ${field}` }, { status: 400 });
        }
      }
    }

    // Validate skills array
    if (skills !== undefined && !Array.isArray(skills)) {
      return NextResponse.json({ error: 'Skills must be an array' }, { status: 400 });
    }

    // Validate timezone
    if (timezone !== undefined && typeof timezone !== 'string') {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    // Build update data object
    const updateData: Record<string, any> = {};
    
    if (name !== undefined) updateData['name'] = name.trim();
    if (jobTitle !== undefined) updateData['jobTitle'] = jobTitle?.trim() || null;
    if (department !== undefined) updateData['department'] = department?.trim() || null;
    if (bio !== undefined) updateData['bio'] = bio?.trim() || null;
    if (skills !== undefined) updateData['skills'] = skills.filter(skill => skill.trim().length > 0);
    if (timezone !== undefined) updateData['timezone'] = timezone || null;
    if (phoneNumber !== undefined) updateData['phoneNumber'] = phoneNumber?.trim() || null;
    if (linkedinUrl !== undefined) updateData['linkedinUrl'] = linkedinUrl?.trim() || null;
    if (twitterUrl !== undefined) updateData['twitterUrl'] = twitterUrl?.trim() || null;
    if (githubUrl !== undefined) updateData['githubUrl'] = githubUrl?.trim() || null;
    if (personalWebsite !== undefined) updateData['personalWebsite'] = personalWebsite?.trim() || null;
    if (startDate !== undefined) updateData['startDate'] = startDate ? new Date(startDate) : null;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        bio: true,
        skills: true,
        timezone: true,
        phoneNumber: true,
        linkedinUrl: true,
        twitterUrl: true,
        githubUrl: true,
        personalWebsite: true,
        startDate: true,
        locale: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logError(error as Error, 'PUT /api/user/profile');
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
