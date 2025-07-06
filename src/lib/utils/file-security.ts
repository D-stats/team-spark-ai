import path from 'path';
import { URL } from 'url';

/**
 * Sanitize a filename to prevent path traversal attacks
 * @param filename - The filename to sanitize
 * @returns Sanitized filename safe for file system operations
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Remove any path separators and parent directory references
  const invalidCharsRegex = /[/\\<>:"|?*\x00-\x1F]/g; // eslint-disable-line no-control-regex
  const sanitized = filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/^\.+/, '') // Remove leading dots
    .replace(invalidCharsRegex, '') // Remove invalid characters and control characters
    .trim();

  // Ensure the filename is not empty after sanitization
  if (!sanitized) {
    return 'unnamed';
  }

  // Limit filename length
  const maxLength = 255;
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
}

/**
 * Extract filename from a URL safely
 * @param url - The URL to extract filename from
 * @returns Sanitized filename or null if extraction fails
 */
export function extractFilenameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = path.basename(pathname);

    // Validate that this is actually a filename and not a directory
    if (!filename || filename === '/' || !filename.includes('.')) {
      return null;
    }

    return sanitizeFilename(filename);
  } catch (error) {
    console.warn('Failed to extract filename from URL:', error);
    return null;
  }
}

/**
 * Validate that a file path is within the expected directory
 * @param filePath - The file path to validate
 * @param expectedDir - The expected directory (e.g., 'avatars')
 * @returns true if the path is safe, false otherwise
 */
export function validateFilePath(filePath: string, expectedDir: string): boolean {
  if (!filePath || !expectedDir) {
    return false;
  }

  // Resolve the path to prevent traversal attacks
  const resolvedPath = path.resolve(filePath);
  const resolvedExpectedDir = path.resolve(expectedDir);

  // Check if the resolved path starts with the expected directory
  return resolvedPath.startsWith(resolvedExpectedDir);
}

/**
 * Extract avatar filename from URL with security validation
 * @param avatarUrl - The avatar URL
 * @returns Sanitized filename for deletion or null if invalid
 */
export function extractAvatarFilename(avatarUrl: string): string | null {
  if (avatarUrl == null || typeof avatarUrl !== 'string' || avatarUrl === '') {
    return null;
  }

  // Extract filename from URL
  const filename = extractFilenameFromUrl(avatarUrl);
  if (filename == null || filename === '') {
    return null;
  }

  // Validate that this looks like an avatar filename
  // Expected format: avatar-{userId}.jpg or similar
  const avatarPattern = /^avatar-[\w-]+\.(jpg|jpeg|png|webp)$/i;
  if (!avatarPattern.test(filename)) {
    console.warn('Invalid avatar filename format:', filename);
    return null;
  }

  return filename;
}

/**
 * Validate file type against allowed types
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns true if valid, false otherwise
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  if (file == null || file.type == null || file.type === '') {
    return false;
  }

  return allowedTypes.includes(file.type);
}

/**
 * Validate file size against maximum allowed size
 * @param file - The file to validate
 * @param maxSize - Maximum allowed size in bytes
 * @returns true if valid, false otherwise
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  if (file == null || typeof file.size !== 'number') {
    return false;
  }

  return file.size <= maxSize;
}
