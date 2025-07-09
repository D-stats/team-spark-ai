'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface OrganizationLogoUploadProps {
  organization: Organization;
  onLogoUpdate?: (logoUrl: string | null) => void;
  className?: string;
}

interface UploadResponse {
  success: boolean;
  data?: {
    organization: Organization;
    logo: {
      url: string;
      filename: string;
      size: number;
    };
  };
  error?: string;
}

export function OrganizationLogoUpload({ organization, onLogoUpdate, className }: OrganizationLogoUploadProps): JSX.Element {
  const t = useTranslations('admin.organization.logo');
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

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);

    // Upload the file directly (no cropping for logos)
    handleUpload(file);
  };

  const handleUpload = async (file: File): Promise<void> => {
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/organization/logo', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as UploadResponse;

      if (!result.success) {
        throw new Error(result.error ?? t('uploadFailed'));
      }

      setSuccess(t('uploadSuccess'));
      setPreviewUrl(null);
      onLogoUpdate?.(result.data?.organization.logoUrl ?? null);

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
      const response = await fetch('/api/organization/logo', {
        method: 'DELETE',
      });

      const result = (await response.json()) as UploadResponse;

      if (!result.success) {
        throw new Error(result.error ?? t('deleteFailed'));
      }

      setSuccess(t('deleteSuccess'));
      onLogoUpdate?.(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Create a proper FileList-like object
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => index === 0 ? file : null,
        [Symbol.iterator]: function* () { yield file; }
      } as FileList;
      
      // Create a proper event object
      const fakeEvent = {
        target: { files: fileList }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handleFileSelect(fakeEvent);
    }
  };

  const displayUrl = previewUrl || organization.logoUrl;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label>{t('title')}</Label>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {/* Logo Preview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            {/* Logo Display */}
            <div className="flex-shrink-0">
              <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {displayUrl ? (
                  <img
                    src={displayUrl}
                    alt={t('preview')}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : (
                  <div className="text-center">
                    <Building className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">{t('noLogo')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Controls */}
            <div className="flex-grow space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                />
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">{t('dragAndDrop')}</p>
                  <p className="text-xs text-gray-500">{t('fileTypes')}</p>
                  <p className="text-xs text-gray-500">{t('maxSize')}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || deleting}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {uploading ? t('uploading') : t('chooseLogo')}
                </Button>

                {organization.logoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    disabled={uploading || deleting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {deleting ? t('deleting') : t('removeLogo')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
          {success}
        </div>
      )}

      {/* Requirements */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• {t('requirements.types')}</p>
        <p>• {t('requirements.size')}</p>
        <p>• {t('requirements.dimensions')}</p>
      </div>
    </div>
  );
}