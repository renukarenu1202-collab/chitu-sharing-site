import React, { useState } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Sparkles,
  Link,
  QrCode,
  ArrowRight,
  Layers,
  Upload,
} from 'lucide-react';
import { DrivePhotoItem } from '../types/photos';
import { UploadedPhotoRecord } from '../services/upload';
import { getPublicViewerUrl } from '../services/drive';

export interface UnifiedSharedItem {
  id: string;
  name: string;
  shareUrl: string;
  previewUrl: string;
  sourceType:
    | 'google_photos_link'
    | 'drive_public'
    | 'drive_link'
    | 'drive_upload'
    | 'custom_link';
  isPublic: boolean;
  dateAdded?: string;
  driveItem?: DrivePhotoItem;
  uploadRecord?: UploadedPhotoRecord;
}

interface SharedFilesHubProps {
  sharedItems: UnifiedSharedItem[];
  onOpenShowcase: (item: UnifiedSharedItem) => void;
  onOpenShareModal: (photo: DrivePhotoItem) => void;
  onOpenUploadModal: () => void;
  onCopySuccess: (msg: string) => void;
}

export const SharedFilesHub: React.FC<SharedFilesHubProps> = ({
  sharedItems,
  onOpenShowcase,
  onOpenShareModal,
  onOpenUploadModal,
  onCopySuccess,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQrItem, setSelectedQrItem] = useState<UnifiedSharedItem | null>(null);

  const handleCopyLink = (item: UnifiedSharedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.shareUrl);
    setCopiedId(item.id);
    onCopySuccess(`Link for "${item.name}" copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllLinks = () => {
    if (sharedItems.length === 0) return;
    const lines = sharedItems.map((item) => `${item.name}: ${item.shareUrl}`);
    navigator.clipboard.writeText(lines.join('\n'));
    onCopySuccess(`Copied ${sharedItems.length} shared links to clipboard!`);
  };

  const sourceBadges = {
    google_photos_link: {
      label: 'Google Photos Link',
      color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    },
    drive_public: {
      label: 'Public Drive Link',
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    },
    drive_link: {
      label: 'Imported Drive Link',
      color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    },
    drive_upload: {
      label: 'Uploaded to Drive',
      color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    },
    custom_link: {
      label: 'Shared Web Link',
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
    },
  };

  return (
    <section className="mb-8 p-5 sm:p-6 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                All Shared Files & Public Links
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {sharedItems.length} active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Photos with public shareable links accessible by anyone without signing in
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          {sharedItems.length > 0 && (
            <button
              type="button"
              onClick={handleCopyAllLinks}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
              title="Copy all shared links to clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Links</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add Shared Link</span>
          </button>
        </div>
      </div>

      {/* Shared items grid / carousel */}
      {sharedItems.length === 0 ? (
        <div className="py-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <Link className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            No public share links active yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Click &quot;Get Link&quot; on any photo below to generate a public shareable URL, or paste a Google Photos shared link.
          </p>
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Google Photos / Drive Link</span>
          </button>
        </div>
      ) : (
        <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sharedItems.map((item) => {
            const badge = sourceBadges[item.sourceType];
            return (
              <div
                key={item.id}
                onClick={() => onOpenShowcase(item)}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* Image thumbnail header */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%23cbd5e1" width="64" height="64"/></svg>';
                    }}
                  />

                  {/* Source Badge */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-xs ${badge.color}`}
                    >
                      <Globe className="w-2.5 h-2.5" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* QR code trigger button on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQrItem(item);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="View QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4
                      className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mb-1"
                      title={item.name}
                    >
                      {item.name}
                    </h4>

                    {/* Share URL input bar */}
                    <div className="relative flex items-center bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 p-1 my-2">
                      <input
                        type="text"
                        readOnly
                        value={item.shareUrl}
                        className="w-full px-2 text-[11px] font-mono bg-transparent text-slate-700 dark:text-slate-300 truncate focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(item, e)}
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1"
                        title="Copy public link"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 truncate">
                      {item.dateAdded
                        ? new Date(item.dateAdded).toLocaleDateString()
                        : 'Public link'}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenShowcase(item);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <span>Showcase Page</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Quick Modal */}
      {selectedQrItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedQrItem(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xs w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 truncate">
              {selectedQrItem.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Scan with smartphone camera
            </p>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 inline-block mb-4 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  selectedQrItem.shareUrl
                )}&bgcolor=ffffff&color=0f172a`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedQrItem(null)}
              className="w-full py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
