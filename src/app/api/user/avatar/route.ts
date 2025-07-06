import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/auth.config';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile } from '@/lib/storage/cloud-storage';
import {
  extractAvatarFilename,
  validateFileType,
  validateFileSize,
} from '@/lib/utils/file-security';
import { uploadRateLimit, applyRateLimit } from '@/lib/auth/rate-limit';
import sharp from 'sharp';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_SIZE = 400; // 400x400 pixels

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Apply rate limiting for avatar uploads
    const rateLimitResponse = await applyRateLimit(request, uploadRateLimit);
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<ApiResponse>;
    }

    const session = await getServerSession(authOptions);

    if (session?.user?.id == null) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (file == null) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!validateFileType(file, ALLOWED_TYPES)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 },
      );
    }

    // Validate file size
    if (!validateFileSize(file, MAX_FILE_SIZE)) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB.' },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image with Sharp
    const processedBuffer = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    // Delete old avatar if exists
    if (currentUser?.avatarUrl != null && currentUser.avatarUrl !== '') {
      try {
        const filename = extractAvatarFilename(currentUser.avatarUrl);
        if (filename != null && filename !== '') {
          await deleteFile(`avatars/${filename}`);
        }
      } catch (error) {
        console.warn('Failed to delete old avatar:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new avatar
    const uploadResult = await uploadFile(
      processedBuffer,
      `avatar-${session.user.id}.jpg`,
      'image/jpeg',
      {
        folder: 'avatars',
        makePublic: true,
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    );

    // Update user avatar URL in database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: uploadResult.url },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        avatar: {
          url: uploadResult.url,
          filename: uploadResult.filename,
          size: uploadResult.size,
        },
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload avatar',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.id == null) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatarUrl: true },
    });

    if (currentUser?.avatarUrl == null || currentUser.avatarUrl === '') {
      return NextResponse.json({ success: false, error: 'No avatar to delete' }, { status: 404 });
    }

    // Delete avatar from cloud storage
    try {
      const filename = extractAvatarFilename(currentUser.avatarUrl);
      if (filename != null && filename !== '') {
        await deleteFile(`avatars/${filename}`);
      }
    } catch (error) {
      console.warn('Failed to delete avatar from storage:', error);
      // Continue with database update even if storage deletion fails
    }

    // Remove avatar URL from database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatarUrl: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Avatar deletion error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete avatar',
      },
      { status: 500 },
    );
  }
}
