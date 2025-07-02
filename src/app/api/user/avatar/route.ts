import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithOrganization } from '@/lib/auth/utils';
import { prisma } from '@/lib/prisma';
import { logError } from '@/lib/logger';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'avatars');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${dbUser.id}-${crypto.randomUUID()}.${fileExtension}`;
    const filePath = join(UPLOAD_DIR, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Delete old avatar if exists
    if (dbUser.avatarUrl) {
      const oldFileName = dbUser.avatarUrl.split('/').pop();
      if (oldFileName) {
        const oldFilePath = join(UPLOAD_DIR, oldFileName);
        try {
          await unlink(oldFilePath);
        } catch (error) {
          // Ignore if file doesn't exist
          console.warn('Could not delete old avatar:', error);
        }
      }
    }

    // Update user avatar URL in database
    const avatarUrl = `/uploads/avatars/${fileName}`;
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        avatarUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      avatarUrl: updatedUser.avatarUrl,
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    logError(error as Error, 'POST /api/user/avatar');
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest): Promise<NextResponse> {
  try {
    const { dbUser } = await requireAuthWithOrganization();

    if (!dbUser.avatarUrl) {
      return NextResponse.json({ error: 'No avatar to delete' }, { status: 400 });
    }

    // Delete file from filesystem
    const fileName = dbUser.avatarUrl.split('/').pop();
    if (fileName) {
      const filePath = join(UPLOAD_DIR, fileName);
      try {
        await unlink(filePath);
      } catch (error) {
        // Ignore if file doesn't exist
        console.warn('Could not delete avatar file:', error);
      }
    }

    // Update user in database
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        avatarUrl: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar removed successfully' 
    });
  } catch (error) {
    logError(error as Error, 'DELETE /api/user/avatar');
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}