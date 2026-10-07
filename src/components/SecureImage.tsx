import React, { useState, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';
import { getAccessToken } from '../services/auth';

interface SecureImageProps {
  thumbnailLink?: string;
  fileId: string;
  alt: string;
  className?: string;
  highRes?: boolean;
}

export const SecureImage: React.FC<SecureImageProps> = ({
  thumbnailLink,
  fileId,
  alt,
  className = '',
  highRes = false,
}) => {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrlToRevoke: string | null = null;

    async function loadImage() {
      setIsLoading(true);
      setHasError(false);

      // Attempt 1: High quality thumbnail URL if provided
      if (thumbnailLink) {
        const enhancedUrl = highRes
          ? thumbnailLink.replace(/=s\d+$/, '=s1600')
          : thumbnailLink.replace(/=s\d+$/, '=s600');

        // Test loading thumbnail
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.crossOrigin = 'anonymous';
        img.src = enhancedUrl;

        img.onload = () => {
          if (isMounted) {
            setSrc(enhancedUrl);
            setIsLoading(false);
          }
        };

        img.onerror = async () => {
          // If direct loading fails, attempt authenticated fetch via Google Drive API
          try {
            const token = await getAccessToken();
            if (!token) throw new Error('No token');

            const res = await fetch(
              `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (!res.ok) throw new Error('Failed to load image blob');

            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            objectUrlToRevoke = blobUrl;

            if (isMounted) {
              setSrc(blobUrl);
              setIsLoading(false);
            }
          } catch {
            if (isMounted) {
              setHasError(true);
              setIsLoading(false);
            }
          }
        };
      } else {
        // No thumbnail link provided, fetch directly via media API
        try {
          const token = await getAccessToken();
          if (!token) throw new Error('No token');

          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!res.ok) throw new Error('Failed to load image blob');

          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          objectUrlToRevoke = blobUrl;

          if (isMounted) {
            setSrc(blobUrl);
            setIsLoading(false);
          }
        } catch {
          if (isMounted) {
            setHasError(true);
            setIsLoading(false);
          }
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [thumbnailLink, fileId, highRes]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse">
          <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-100 dark:bg-slate-800 text-slate-400">
          <AlertCircle className="w-6 h-6 mb-1 text-slate-400" />
          <span className="text-xs line-clamp-2">{alt}</span>
        </div>
      ) : (
        src && (
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )
      )}
    </div>
  );
};
