'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, X, Camera, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface AvatarUploadProps {
  user: User;
  onAvatarUpdate?: (avatarUrl: string | null) => void;
  className?: string;
}

interface UploadResponse {
  success: boolean;
  data?: {
    user: User;
    avatar: {
      url: string;
      filename: string;
      size: number;
    };
  };
  error?: string;
}

export function AvatarUpload({ user, onAvatarUpdate, className }: AvatarUploadProps): JSX.Element {
  const t = useTranslations('settings.profile.avatar');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('invalidFileType'));
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t('fileTooLarge'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    handleUpload(file);
  };

  const handleUpload = async (file: File): Promise<void> => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as UploadResponse;

      if (!result.success) {
        throw new Error(result.error ?? t('uploadFailed'));
      }

      setSuccess(t('uploadSuccess'));
      setPreviewUrl(null);
      onAvatarUpdate?.(result.data?.user.avatarUrl ?? null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadFailed'));
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      const result = (await response.json()) as UploadResponse;

      if (!result.success) {
        throw new Error(result.error ?? t('deleteFailed'));
      }

      setSuccess(t('deleteSuccess'));
      onAvatarUpdate?.(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleClick = (): void => {
    fileInputRef.current?.click();
  };

  const clearMessages = (): void => {
    setError(null);
    setSuccess(null);
  };

  const displayAvatarUrl = previewUrl ?? user.avatarUrl;
  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('title')}</Label>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>

          {/* Error/Success Messages */}
          {error != null && error !== '' && (
            <div className="flex items-center justify-between rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-destructive hover:text-destructive"
                onClick={clearMessages}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {success != null && success !== '' && (
            <div className="flex items-center justify-between rounded-md bg-green-50 p-3 text-sm text-green-700">
              <span>{success}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-green-700 hover:text-green-700"
                onClick={clearMessages}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Avatar Display and Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={displayAvatarUrl ?? undefined} alt={user.name} />
                <AvatarFallback className="text-lg">
                  {displayAvatarUrl != null && displayAvatarUrl !== '' ? null : (
                    <User className="h-8 w-8" />
                  )}
                  {(displayAvatarUrl == null || displayAvatarUrl === '') && userInitials}
                </AvatarFallback>
              </Avatar>

              {previewUrl != null && previewUrl !== '' && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Upload className="h-6 w-6 animate-pulse text-white" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClick}
                  disabled={uploading || deleting}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {uploading ? t('uploading') : t('uploadButton')}
                </Button>

                {user.avatarUrl != null && user.avatarUrl !== '' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={uploading || deleting}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                    {deleting ? t('deleting') : t('removeButton')}
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">{t('requirements')}</p>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading || deleting}
          />
        </div>
      </CardContent>
    </Card>
  );
}
