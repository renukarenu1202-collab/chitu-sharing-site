import React, { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Globe,
  Lock,
  Download,
  ExternalLink,
  Share2,
  Calendar,
  Camera,
  Info,
  Maximize2,
  Copy,
  Check,
} from 'lucide-react';
import { DrivePhotoItem } from '../types/photos';
import { SecureImage } from './SecureImage';
import { getPublicViewerUrl, getDirectDownloadUrl } from '../services/drive';

interface LightboxModalProps {
  photos: DrivePhotoItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  onOpenShareModal: (photo: DrivePhotoItem) => void;
  onRequestMakePublic: (photo: DrivePhotoItem) => void;
  onRequestRevokePublic: (photo: DrivePhotoItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
  onOpenShareModal,
  onRequestMakePublic,
  onRequestRevokePublic,
}) => {
  const [showDetails, setShowDetails] = useState(true);
  const [copied, setCopied] = useState(false);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onSelectIndex(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) onSelectIndex(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, photos.length, onClose, onSelectIndex]);

  if (!isOpen || !currentPhoto) return null;

  const publicLink = getPublicViewerUrl(currentPhoto.id);
  const downloadLink = getDirectDownloadUrl(currentPhoto.id);

  const formatBytes = (bytes?: string | number) => {
    if (!bytes) return 'Unknown size';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num)) return 'Unknown size';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown date';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md text-white animate-in fade-in duration-200"
    >
      {/* Top action bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-medium text-slate-400">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
            {currentPhoto.name}
          </span>
          {currentPhoto.isPublic ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Globe className="w-3 h-3" />
              <span>Public</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              <Lock className="w-3 h-3" />
              <span>Private</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Copy Link */}
          <button
            type="button"
            onClick={copyPublicLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Copy Share Link"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {/* Share button */}
          <button
            type="button"
            onClick={() => onOpenShareModal(currentPhoto)}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Share options & QR code"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Details toggle */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showDetails
                ? 'bg-white/20 text-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Info Panel"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Download */}
          <a
            href={downloadLink}
            target="_blank"
            rel="noreferrer"
            download={currentPhoto.name}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Download original file"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer ml-1"
            title="Close viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main viewer body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Previous button */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() => onSelectIndex(currentIndex - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-xs border border-white/10 cursor-pointer shadow-lg"
            title="Previous (Left arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next button */}
        {currentIndex < photos.length - 1 && (
          <button
            type="button"
            onClick={() => onSelectIndex(currentIndex + 1)}
            className="absolute right-4 md:right-80 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all backdrop-blur-xs border border-white/10 cursor-pointer shadow-lg"
            title="Next (Right arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Image Display Area */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none">
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <SecureImage
              fileId={currentPhoto.id}
              thumbnailLink={currentPhoto.thumbnailLink}
              alt={currentPhoto.name}
              highRes={true}
              className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl bg-transparent"
            />
          </div>
        </div>

        {/* Metadata Sidebar */}
        {showDetails && (
          <aside className="w-80 border-l border-white/10 bg-slate-900/90 backdrop-blur-md p-5 overflow-y-auto space-y-6 shrink-0 transition-all">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Sharing & Access
              </h4>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">Public Visibility:</span>
                  {currentPhoto.isPublic ? (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> Anyone with link
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Restricted (Private)
                    </span>
                  )}
                </div>

                {currentPhoto.isPublic ? (
                  <button
                    type="button"
                    onClick={() => onRequestRevokePublic(currentPhoto)}
                    className="w-full py-2 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl transition-colors cursor-pointer"
                  >
                    Revoke Public Link
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRequestMakePublic(currentPhoto)}
                    className="w-full py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Make Public & Create Link
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onOpenShareModal(currentPhoto)}
                  className="w-full py-2 text-xs font-medium bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>View All Links & QR Code</span>
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                File Details
              </h4>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">File Name</span>
                  <span className="font-mono text-right truncate max-w-[150px]" title={currentPhoto.name}>
                    {currentPhoto.name}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">File Size</span>
                  <span>{formatBytes(currentPhoto.size)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Format</span>
                  <span className="uppercase">{currentPhoto.mimeType.replace('image/', '')}</span>
                </div>
                {currentPhoto.imageMediaMetadata?.width && currentPhoto.imageMediaMetadata?.height && (
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Resolution</span>
                    <span>
                      {currentPhoto.imageMediaMetadata.width} × {currentPhoto.imageMediaMetadata.height}
                      <span className="text-slate-500 ml-1">
                        (
                        {(
                          (currentPhoto.imageMediaMetadata.width *
                            currentPhoto.imageMediaMetadata.height) /
                          1_000_000
                        ).toFixed(1)}{' '}
                        MP)
                      </span>
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Date Added</span>
                  <span>{formatDate(currentPhoto.createdTime)}</span>
                </div>
              </div>
            </div>

            {/* EXIF / Camera Info */}
            {(currentPhoto.imageMediaMetadata?.cameraMake ||
              currentPhoto.imageMediaMetadata?.cameraModel ||
              currentPhoto.imageMediaMetadata?.isoSpeed) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera & Exposure</span>
                </h4>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300">
                  {(currentPhoto.imageMediaMetadata?.cameraMake ||
                    currentPhoto.imageMediaMetadata?.cameraModel) && (
                    <div className="font-medium text-white">
                      {currentPhoto.imageMediaMetadata.cameraMake}{' '}
                      {currentPhoto.imageMediaMetadata.cameraModel}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-slate-400 pt-1">
                    {currentPhoto.imageMediaMetadata?.focalLength && (
                      <div>
                        Focal:{' '}
                        <span className="text-slate-200">
                          {currentPhoto.imageMediaMetadata.focalLength}mm
                        </span>
                      </div>
                    )}
                    {currentPhoto.imageMediaMetadata?.aperture && (
                      <div>
                        Aperture:{' '}
                        <span className="text-slate-200">
                          f/{currentPhoto.imageMediaMetadata.aperture}
                        </span>
                      </div>
                    )}
                    {currentPhoto.imageMediaMetadata?.exposureTime && (
                      <div>
                        Exposure:{' '}
                        <span className="text-slate-200">
                          {currentPhoto.imageMediaMetadata.exposureTime}s
                        </span>
                      </div>
                    )}
                    {currentPhoto.imageMediaMetadata?.isoSpeed && (
                      <div>
                        ISO:{' '}
                        <span className="text-slate-200">
                          {currentPhoto.imageMediaMetadata.isoSpeed}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Google Drive Link */}
            <div className="pt-2">
              <a
                href={currentPhoto.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs flex items-center justify-center gap-2 transition-colors border border-white/10"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Drive</span>
              </a>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
