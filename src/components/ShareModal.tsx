import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Lock,
  Code,
  QrCode,
  Download,
  Share2,
} from 'lucide-react';
import { DrivePhotoItem } from '../types/photos';
import { getPublicViewerUrl, getDirectImageUrl, getDirectDownloadUrl } from '../services/drive';

interface ShareModalProps {
  photo: DrivePhotoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestMakePublic: (photo: DrivePhotoItem) => void;
  onRequestRevokePublic: (photo: DrivePhotoItem) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  photo,
  isOpen,
  onClose,
  onRequestMakePublic,
  onRequestRevokePublic,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'links' | 'embed' | 'qr'>('links');

  if (!isOpen || !photo) return null;

  const publicLink = getPublicViewerUrl(photo.id);
  const directLink = getDirectImageUrl(photo.id);
  const downloadLink = getDirectDownloadUrl(photo.id);
  const embedHtml = `<img src="${directLink}" alt="${photo.name}" />`;
  const markdownCode = `![${photo.name}](${directLink})`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType(null);
    }, 2000);
  };

  // QR Code URL via Google chart / quickchart API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    publicLink
  )}&bgcolor=ffffff&color=1e293b`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Share Photo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                {photo.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between border-b ${
            photo.isPublic
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {photo.isPublic ? (
              <>
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-medium">
                  Public Shareable Link is active (Anyone with the link can view)
                </span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-medium">
                  Currently Private (Only you have access)
                </span>
              </>
            )}
          </div>

          {photo.isPublic ? (
            <button
              type="button"
              onClick={() => {
                onRequestRevokePublic(photo);
              }}
              className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-800 underline cursor-pointer shrink-0"
            >
              Make Private
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onRequestMakePublic(photo);
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-colors shrink-0"
            >
              Enable Public Link
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-3 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'links'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Shareable Links
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('embed')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'embed'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Embed Codes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'qr'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            QR Code
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'links' && (
            <>
              {/* Public Viewer Link */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Public Share Link (Google Viewer)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      readOnly
                      value={publicLink}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(publicLink, 'publicLink')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    {copiedType === 'publicLink' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={publicLink}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors shrink-0"
                    title="Open link in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Direct Image URL */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Direct Image CDN Link (Instant Rendering)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={directLink}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(directLink, 'directLink')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedType === 'directLink' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Download URL */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Direct Download Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={downloadLink}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(downloadLink, 'downloadLink')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedType === 'downloadLink' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  HTML Tag
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={embedHtml}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(embedHtml, 'embedHtml')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    {copiedType === 'embedHtml' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Markdown Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={markdownCode}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(markdownCode, 'markdownCode')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedType === 'markdownCode' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qr' && (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 mb-3">
                <img
                  src={qrCodeUrl}
                  alt={`QR code for ${photo.name}`}
                  className="w-48 h-48 rounded-lg"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Scan with any smartphone camera to instantly open and view this photo
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {photo.imageMediaMetadata?.width && photo.imageMediaMetadata?.height
              ? `${photo.imageMediaMetadata.width} × ${photo.imageMediaMetadata.height} px`
              : photo.mimeType}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
