'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Crop as CropIcon, RotateCcw } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

const CROP_ASPECT_RATIO = 1; // 1:1 aspect ratio for avatar
const MIN_CROP_SIZE = 100; // Minimum crop size in pixels

export function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
}: ImageCropModalProps): JSX.Element {
  const t = useTranslations('settings.profile.avatar.crop');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [loading, setLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;

    // Calculate initial crop - centered square
    const cropSize = Math.min(naturalWidth, naturalHeight);
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: 'px',
          width: cropSize * 0.8, // Start with 80% of the smallest dimension
        },
        CROP_ASPECT_RATIO,
        naturalWidth,
        naturalHeight,
      ),
      naturalWidth,
      naturalHeight,
    );

    setCrop(crop);
    setCompletedCrop(crop);
  }, []);

  const resetCrop = useCallback(() => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      const cropSize = Math.min(naturalWidth, naturalHeight);
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: 'px',
            width: cropSize * 0.8,
          },
          CROP_ASPECT_RATIO,
          naturalWidth,
          naturalHeight,
        ),
        naturalWidth,
        naturalHeight,
      );

      setCrop(crop);
      setCompletedCrop(crop);
    }
  }, []);

  const getCroppedImageBlob = useCallback(async (crop: PixelCrop): Promise<Blob | null> => {
    const image = imgRef.current;
    const canvas = canvasRef.current;

    if (image == null || canvas == null || crop == null) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    // Set canvas size to the target avatar size (400x400)
    const targetSize = 400;
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    // Clear canvas
    ctx.clearRect(0, 0, targetSize, targetSize);

    // Draw the cropped and resized image
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, targetSize, targetSize);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.9, // High quality
      );
    });
  }, []);

  const handleCropComplete = async (): Promise<void> => {
    if (!completedCrop) {
      return;
    }

    setLoading(true);

    try {
      const croppedBlob = await getCroppedImageBlob(completedCrop);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
        onClose();
      }
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CropIcon className="mr-2 h-5 w-5" />
              {t('title')}
            </DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Crop Area */}
            <div className="flex justify-center">
              <div className="relative max-h-96 overflow-auto rounded-lg border">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={CROP_ASPECT_RATIO}
                  minWidth={MIN_CROP_SIZE}
                  minHeight={MIN_CROP_SIZE}
                  keepSelection
                  circularCrop
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt={t('imageAlt')}
                    onLoad={onImageLoad}
                    className="max-h-96 max-w-full"
                  />
                </ReactCrop>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm text-blue-700">{t('instructions')}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetCrop} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                {t('resetButton')}
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={loading}>
                  {t('cancelButton')}
                </Button>
                <Button onClick={handleCropComplete} disabled={loading || !completedCrop}>
                  {loading ? t('applying') : t('applyButton')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
