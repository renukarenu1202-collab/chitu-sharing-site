import React, { useState } from 'react';
import {
  Globe,
  Lock,
  Copy,
  Check,
  Share2,
  ExternalLink,
  CheckSquare,
  Square,
  Maximize2,
} from 'lucide-react';
import { DrivePhotoItem } from '../types/photos';
import { SecureImage } from './SecureImage';
import { getPublicViewerUrl } from '../services/drive';

interface PhotoCardProps {
  photo: DrivePhotoItem;
  isSelected: boolean;
  onToggleSelect: (photo: DrivePhotoItem, e: React.MouseEvent) => void;
  onClick: (photo: DrivePhotoItem) => void;
  onShare: (photo: DrivePhotoItem, e: React.MouseEvent) => void;
  onRequestMakePublic: (photo: DrivePhotoItem, e: React.MouseEvent) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  isSelected,
  onToggleSelect,
  onClick,
  onShare,
  onRequestMakePublic,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!photo.isPublic) {
      onRequestMakePublic(photo, e);
      return;
    }

    const publicUrl = getPublicViewerUrl(photo.id);
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return '';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num)) return '';
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(0)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      onClick={() => onClick(photo)}
      className={`group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-200 cursor-pointer select-none ${
        isSelected
          ? 'ring-2 ring-blue-600 border-blue-600 shadow-md'
          : 'border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Thumbnail Aspect Ratio Container */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <SecureImage
          fileId={photo.id}
          thumbnailLink={photo.thumbnailLink}
          alt={photo.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Selection Checkbox (always visible if selected, or on hover) */}
        <button
          type="button"
          onClick={(e) => onToggleSelect(photo, e)}
          className={`absolute top-2.5 left-2.5 z-10 p-1.5 rounded-xl backdrop-blur-xs transition-all cursor-pointer ${
            isSelected
              ? 'bg-blue-600 text-white shadow-md opacity-100'
              : 'bg-black/40 text-white/90 hover:bg-black/70 opacity-0 group-hover:opacity-100'
          }`}
          title={isSelected ? 'Deselect photo' : 'Select photo'}
        >
          {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>

        {/* Share Status Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {photo.isPublic ? (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/90 text-white shadow-xs backdrop-blur-xs"
              title="Public link active - anyone with the link can view"
            >
              <Globe className="w-3 h-3" />
              <span>Public</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-black/50 text-white/90 backdrop-blur-xs opacity-75 group-hover:opacity-100 transition-opacity"
              title="Private"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Private</span>
            </span>
          )}
        </div>

        {/* Hover Action Bar */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Quick Copy / Make Public */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl backdrop-blur-md transition-all shadow-sm cursor-pointer ${
              photo.isPublic
                ? 'bg-white/90 hover:bg-white text-slate-900'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={photo.isPublic ? 'Copy Public Share Link' : 'Make Public & Get Link'}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>{photo.isPublic ? 'Copy Link' : 'Get Link'}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1">
            {/* Share modal */}
            <button
              type="button"
              onClick={(e) => onShare(photo, e)}
              className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
              title="Share options & QR"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Quick full view */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClick(photo);
              }}
              className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-colors cursor-pointer"
              title="View full size"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3">
        <h4 className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={photo.name}>
          {photo.name}
        </h4>
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{formatFileSize(photo.size)}</span>
          {photo.imageMediaMetadata?.width && photo.imageMediaMetadata?.height && (
            <span>
              {photo.imageMediaMetadata.width}×{photo.imageMediaMetadata.height}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
