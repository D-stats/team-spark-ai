import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/utils';
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
const LOGO_MAX_WIDTH = 800; // Maximum width for organization logo
const LOGO_MAX_HEIGHT = 400; // Maximum height for organization logo

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Apply rate limiting for logo uploads
    const rateLimitResponse = await applyRateLimit(request, uploadRateLimit);
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<ApiResponse>;
    }

    const user = await requireAuth();

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;

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

    // Get image metadata first
    const metadata = await sharp(buffer).metadata();
    
    // Calculate resize dimensions while maintaining aspect ratio
    let width = metadata.width || LOGO_MAX_WIDTH;
    let height = metadata.height || LOGO_MAX_HEIGHT;
    
    if (width > LOGO_MAX_WIDTH || height > LOGO_MAX_HEIGHT) {
      const aspectRatio = width / height;
      if (width > height) {
        width = LOGO_MAX_WIDTH;
        height = Math.round(LOGO_MAX_WIDTH / aspectRatio);
      } else {
        height = LOGO_MAX_HEIGHT;
        width = Math.round(LOGO_MAX_HEIGHT * aspectRatio);
      }
    }

    // Process image with Sharp - resize while maintaining aspect ratio
    const processedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    // Get current organization to check for existing logo
    const currentOrganization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { logoUrl: true },
    });

    // Delete old logo if exists
    if (currentOrganization?.logoUrl != null && currentOrganization.logoUrl !== '') {
      try {
        const filename = extractAvatarFilename(currentOrganization.logoUrl);
        if (filename != null && filename !== '') {
          await deleteFile(`logos/${filename}`);
        }
      } catch (error) {
        console.warn('Failed to delete old logo:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new logo
    const uploadResult = await uploadFile(
      processedBuffer,
      `logo-${user.organizationId}.jpg`,
      'image/jpeg',
      {
        folder: 'logos',
        makePublic: true,
        cacheControl: 'public, max-age=31536000', // 1 year
      },
    );

    // Update organization logo URL in database
    const updatedOrganization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: { logoUrl: uploadResult.url },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        organization: updatedOrganization,
        logo: {
          url: uploadResult.url,
          filename: uploadResult.filename,
          size: uploadResult.size,
        },
      },
    });
  } catch (error) {
    console.error('Logo upload error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload logo',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    // Get current organization logo
    const currentOrganization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { logoUrl: true },
    });

    if (currentOrganization?.logoUrl == null || currentOrganization.logoUrl === '') {
      return NextResponse.json({ success: false, error: 'No logo to delete' }, { status: 404 });
    }

    // Delete logo from cloud storage
    try {
      const filename = extractAvatarFilename(currentOrganization.logoUrl);
      if (filename != null && filename !== '') {
        await deleteFile(`logos/${filename}`);
      }
    } catch (error) {
      console.warn('Failed to delete logo from storage:', error);
      // Continue with database update even if storage deletion fails
    }

    // Remove logo URL from database
    const updatedOrganization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: { logoUrl: null },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { organization: updatedOrganization },
    });
  } catch (error) {
    console.error('Logo deletion error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete logo',
      },
      { status: 500 },
    );
  }
}