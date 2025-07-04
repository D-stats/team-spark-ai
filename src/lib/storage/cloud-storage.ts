import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env['GOOGLE_CLOUD_PROJECT_ID'],
  keyFilename: process.env['GOOGLE_CLOUD_KEY_FILE'],
});

const bucketName = process.env['GOOGLE_CLOUD_STORAGE_BUCKET'] ?? 'team-spark-ai-uploads';
const bucket = storage.bucket(bucketName);

export interface UploadOptions {
  folder?: string;
  makePublic?: boolean;
  cacheControl?: string;
}

export interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  contentType: string;
}

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const {
    folder = 'uploads',
    makePublic = true,
    cacheControl = 'public, max-age=31536000', // 1 year
  } = options;

  // Generate unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() ?? '';
  const filename = `${folder}/${timestamp}-${randomSuffix}.${extension}`;

  const file = bucket.file(filename);

  // Upload the file
  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl,
    },
    public: makePublic,
  });

  // Get public URL
  const url = makePublic
    ? `https://storage.googleapis.com/${bucketName}/${filename}`
    : (
        await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        })
      )[0];

  return {
    url,
    filename,
    originalName,
    size: buffer.length,
    contentType,
  };
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFile(filename: string): Promise<boolean> {
  try {
    const file = bucket.file(filename);
    await file.delete();
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Get a signed URL for a private file
 */
export async function getSignedUrl(filename: string, expiresIn: number = 60): Promise<string> {
  const file = bucket.file(filename);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresIn * 60 * 1000, // expiresIn minutes
  });
  return url;
}

/**
 * Check if a file exists in the bucket
 */
export async function fileExists(filename: string): Promise<boolean> {
  try {
    const file = bucket.file(filename);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}
