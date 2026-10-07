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
  Eye,
} from 'lucide-react';
import { DrivePhotoItem } from '../types/photos';
import { SecureImage } from './SecureImage';
import { getPublicViewerUrl } from '../services/drive';

interface PhotoListProps {
  photos: DrivePhotoItem[];
  selectedIds: Set<string>;
  onToggleSelect: (photo: DrivePhotoItem, e: React.MouseEvent) => void;
  onClick: (photo: DrivePhotoItem) => void;
  onShare: (photo: DrivePhotoItem, e: React.MouseEvent) => void;
  onRequestMakePublic: (photo: DrivePhotoItem, e: React.MouseEvent) => void;
  onRequestRevokePublic: (photo: DrivePhotoItem, e: React.MouseEvent) => void;
}

export const PhotoList: React.FC<PhotoListProps> = ({
  photos,
  selectedIds,
  onToggleSelect,
  onClick,
  onShare,
  onRequestMakePublic,
  onRequestRevokePublic,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (photo: DrivePhotoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!photo.isPublic) {
      onRequestMakePublic(photo, e);
      return;
    }
    const publicUrl = getPublicViewerUrl(photo.id);
    navigator.clipboard.writeText(publicUrl);
    setCopiedId(photo.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return '—';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num)) return '—';
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(0)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <th className="p-3 w-10 text-center">#</th>
              <th className="p-3 w-14">Preview</th>
              <th className="p-3">File Name</th>
              <th className="p-3">Share Status</th>
              <th className="p-3 hidden sm:table-cell">Resolution</th>
              <th className="p-3 hidden md:table-cell">File Size</th>
              <th className="p-3 hidden lg:table-cell">Date Added</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {photos.map((photo) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <tr
                  key={photo.id}
                  onClick={() => onClick(photo)}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => onToggleSelect(photo, e)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  <td className="p-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                      <SecureImage
                        fileId={photo.id}
                        thumbnailLink={photo.thumbnailLink}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-xs sm:max-w-sm">
                      {photo.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">
                      {photo.mimeType}
                    </div>
                  </td>

                  <td className="p-3">
                    {photo.isPublic ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                        <Globe className="w-3 h-3" />
                        <span>Public Link</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <Lock className="w-3 h-3" />
                        <span>Private</span>
                      </span>
                    )}
                  </td>

                  <td className="p-3 hidden sm:table-cell text-slate-600 dark:text-slate-300">
                    {photo.imageMediaMetadata?.width && photo.imageMediaMetadata?.height
                      ? `${photo.imageMediaMetadata.width} × ${photo.imageMediaMetadata.height}`
                      : '—'}
                  </td>

                  <td className="p-3 hidden md:table-cell text-slate-600 dark:text-slate-300">
                    {formatFileSize(photo.size)}
                  </td>

                  <td className="p-3 hidden lg:table-cell text-slate-500 dark:text-slate-400">
                    {formatDate(photo.createdTime)}
                  </td>

                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(photo, e)}
                        className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
                          photo.isPublic
                            ? 'bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400'
                        }`}
                        title={photo.isPublic ? 'Copy Public Share Link' : 'Make Public & Get Link'}
                      >
                        {copiedId === photo.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{photo.isPublic ? 'Copy' : 'Get Link'}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => onShare(photo, e)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Share Options & QR"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
