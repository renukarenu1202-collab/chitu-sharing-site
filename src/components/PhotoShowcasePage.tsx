import React, { useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Globe,
  Share2,
  Download,
  QrCode,
  Code,
  Calendar,
  Layers,
  Sparkles,
  Maximize2,
  Sun,
  Moon,
  Trash2,
  MessageCircle,
  Send,
  Upload,
} from 'lucide-react';
import { UploadedPhotoRecord } from '../services/upload';

interface PhotoShowcasePageProps {
  photo: UploadedPhotoRecord;
  allUploads: UploadedPhotoRecord[];
  onBackToGallery: () => void;
  onSelectPhoto: (photo: UploadedPhotoRecord) => void;
  onOpenUploadModal: () => void;
  onDeleteRecord?: (id: string) => void;
}

export const PhotoShowcasePage: React.FC<PhotoShowcasePageProps> = ({
  photo,
  allUploads,
  onBackToGallery,
  onSelectPhoto,
  onOpenUploadModal,
  onDeleteRecord,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDarkBg, setIsDarkBg] = useState(true);
  const [showQrExpanded, setShowQrExpanded] = useState(false);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isGooglePhotos = photo.sourceType === 'google_photos_link';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    photo.publicShareUrl
  )}&bgcolor=ffffff&color=0f172a`;

  const htmlEmbed = `<img src="${photo.previewUrl}" alt="${photo.name}" />`;
  const markdownEmbed = `![${photo.name}](${photo.publicShareUrl})`;

  const shareTitle = encodeURIComponent(`Check out this photo: ${photo.name}`);
  const shareUrl = encodeURIComponent(photo.publicShareUrl);

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return '—';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num)) return '—';
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  };

  const sourceLabel = {
    drive_upload: 'Direct Google Drive Upload',
    drive_link: 'Google Drive Shared Link',
    google_photos_link: 'Google Photos Shared Link',
    custom_link: 'Web Image Link',
  }[photo.sourceType];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToGallery}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Gallery</span>
            </button>
            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Photo Showcase Page
              </span>
              <span>•</span>
              <span className="truncate max-w-xs">{photo.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload / Link Another</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Showcase Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Photo Successfully Uploaded & Public Link Ready!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Anyone on the web can now view this photo using your public share link.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Public Share Active</span>
            </span>
          </div>
        </div>

        {/* 2-Column Showcase Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Canvas (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className={`relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl transition-colors ${
                isDarkBg ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'
              }`}
            >
              {/* Canvas controls header */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDarkBg(!isDarkBg)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title={isDarkBg ? 'Switch to light backdrop' : 'Switch to dark backdrop'}
                >
                  {isDarkBg ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <a
                  href={photo.publicShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Open in new window"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Photo Display */}
              <div className="min-h-[380px] max-h-[580px] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                {isGooglePhotos ? (
                  // Google Photos shared link preview
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-blue-500 p-1 shadow-xl mb-4">
                      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center">
                        <Share2 className="w-10 h-10 text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                      {photo.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6">
                      Shared via Google Photos Public Link. Click below to view the full resolution album / photo.
                    </p>
                    <a
                      href={photo.publicShareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-colors"
                    >
                      <span>Open on Google Photos</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <img
                    src={photo.previewUrl}
                    alt={photo.name}
                    referrerPolicy="no-referrer"
                    className="max-h-[540px] max-w-full object-contain rounded-xl shadow-md transition-transform duration-200"
                    onError={(e) => {
                      // Fallback to Google Drive view if thumbnail CDN fails
                      if (photo.driveFileId) {
                        (e.target as HTMLImageElement).src = `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w1600`;
                      }
                    }}
                  />
                )}
              </div>

              {/* Canvas Footer */}
              <div className="px-5 py-3 border-t border-slate-200/40 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium truncate max-w-xs">{photo.name}</span>
                <span className="shrink-0">{sourceLabel}</span>
              </div>
            </div>

            {/* Recent Uploads Thumbnails Bar */}
            {allUploads.length > 1 && (
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Other Uploaded & Linked Photos ({allUploads.length})</span>
                </h4>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {allUploads.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectPhoto(item)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        item.id === photo.id
                          ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                          : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect fill="%23cbd5e1" width="64" height="64"/></svg>';
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Public Share Links, QR Code, Details (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Primary Shareable Link Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Public Shareable Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={photo.publicShareUrl}
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(photo.publicShareUrl, 'primary')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'primary' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instant Social Share Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Share directly to:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <a
                    href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 text-xs font-medium transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 mb-1" />
                    <span>WhatsApp</span>
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 hover:bg-sky-100 text-xs font-medium transition-colors"
                  >
                    <Send className="w-4 h-4 mb-1" />
                    <span>Telegram</span>
                  </a>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 text-xs font-medium transition-colors"
                  >
                    <Share2 className="w-4 h-4 mb-1" />
                    <span>X / Twitter</span>
                  </a>
                  <a
                    href={`mailto:?subject=${shareTitle}&body=Here is the public link: ${photo.publicShareUrl}`}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mb-1" />
                    <span>Email</span>
                  </a>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Mobile QR Code
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Scan to view on phone
                    </p>
                  </div>
                </div>

                <a
                  href={qrCodeUrl}
                  download={`qrcode-${photo.name}.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
                >
                  Download QR
                </a>
              </div>
            </div>

            {/* Direct CDN & Embed Codes Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Code className="w-4 h-4 text-blue-500" />
                <span>Embed & Direct Image Codes</span>
              </h4>

              {/* Direct image link */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Direct Image CDN Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={photo.previewUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(photo.previewUrl, 'cdn')}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                    title="Copy direct CDN link"
                  >
                    {copiedKey === 'cdn' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* HTML Embed */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  HTML Tag
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={htmlEmbed}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(htmlEmbed, 'html')}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                    title="Copy HTML"
                  >
                    {copiedKey === 'html' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Markdown Embed */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Markdown Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={markdownEmbed}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyText(markdownEmbed, 'md')}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors cursor-pointer"
                    title="Copy Markdown"
                  >
                    {copiedKey === 'md' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Photo Details & Metadata Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Photo Information
              </h4>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">File Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {photo.name}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Source</span>
                  <span className="font-medium">{sourceLabel}</span>
                </div>
                {photo.size && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">File Size</span>
                    <span>{formatFileSize(photo.size)}</span>
                  </div>
                )}
                {photo.width && photo.height && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Resolution</span>
                    <span>
                      {photo.width} × {photo.height} px
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Date Added</span>
                  <span>{new Date(photo.uploadedAt).toLocaleString()}</span>
                </div>
              </div>

              {onDeleteRecord && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onDeleteRecord(photo.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from Uploaded Showcase</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
