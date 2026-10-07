import React, { useState } from 'react';
import {
  Globe,
  Copy,
  Check,
  ExternalLink,
  Download,
  QrCode,
  FileText,
  FileImage,
  File,
  Search,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  X,
} from 'lucide-react';
import { UploadedPhotoRecord, FileCategory } from '../services/upload';

interface UploadedFilesHubProps {
  files: UploadedPhotoRecord[];
  onDeleteFile: (id: string) => void;
  onClearAll: () => void;
  onCopySuccess: (msg: string) => void;
}

export const UploadedFilesHub: React.FC<UploadedFilesHubProps> = ({
  files,
  onDeleteFile,
  onClearAll,
  onCopySuccess,
}) => {
  const [activeCategory, setActiveCategory] = useState<FileCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedQrFile, setSelectedQrFile] = useState<UploadedPhotoRecord | null>(null);

  const handleCopyLink = (file: UploadedPhotoRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(file.publicShareUrl);
    setCopiedId(file.id);
    onCopySuccess(`Copied public link for "${file.name}"!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllLinks = () => {
    if (files.length === 0) return;
    const lines = filteredFiles.map((f) => `${f.name}: ${f.publicShareUrl}`);
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    onCopySuccess(`Copied ${filteredFiles.length} public links to clipboard!`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCSV = () => {
    if (files.length === 0) return;
    const rows = [
      ['File Name', 'Category', 'Public Viewable Link', 'Date Added'].join(','),
      ...files.map((f) =>
        [
          `"${f.name.replace(/"/g, '""')}"`,
          f.category,
          `"${f.publicShareUrl}"`,
          `"${new Date(f.uploadedAt).toLocaleString()}"`,
        ].join(',')
      ),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `public_links_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return '—';
    const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(num)) return '—';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(0)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Counts by category
  const imgCount = files.filter((f) => f.category === 'image').length;
  const pdfCount = files.filter((f) => f.category === 'pdf').length;
  const docCount = files.filter((f) => f.category === 'document').length;

  const filteredFiles = files.filter((f) => {
    if (activeCategory !== 'all' && f.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      return f.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  const getCategoryBadge = (category: FileCategory) => {
    switch (category) {
      case 'image':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <FileImage className="w-3 h-3" /> Image
          </span>
        );
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <FileText className="w-3 h-3" /> PDF
          </span>
        );
      case 'document':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <File className="w-3 h-3" /> Document
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            File
          </span>
        );
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Uploaded Files & Public Viewable Links
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {files.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct public viewable links ready for sharing with anyone on the internet
            </p>
          </div>
        </div>

        {/* Global Batch Actions */}
        {files.length > 0 && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopyAllLinks}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Copy all public links to clipboard"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Copied All!' : 'Copy All Links'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Export CSV of all links"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onClearAll}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Clear all uploaded files"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {files.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500">
          <Globe className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
            No files uploaded yet
          </h3>
          <p className="text-xs max-w-sm mx-auto">
            Use Option 1 above to upload bulk Images, PDFs, and Docs, or Option 2 to import Google Drive and Photos links.
          </p>
        </div>
      ) : (
        <>
          {/* Controls: Search & Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-5 pb-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All Files ({files.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('image')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'image'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                <FileImage className="w-3.5 h-3.5" />
                <span>Images ({imgCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('pdf')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'pdf'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDFs ({pdfCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('document')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeCategory === 'document'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                }`}
              >
                <File className="w-3.5 h-3.5" />
                <span>Docs ({docCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search uploaded files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Files List / Grid */}
          <div className="space-y-3 pt-2">
            {filteredFiles.map((file) => {
              const isImage = file.category === 'image';
              const isPdf = file.category === 'pdf';
              return (
                <div
                  key={file.id}
                  className="p-4 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left: Thumbnail & Name */}
                  <div className="flex items-center gap-3.5 min-w-0 md:max-w-xs lg:max-w-sm">
                    {/* Thumbnail / Icon */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                      {isImage && file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect fill="%23cbd5e1" width="48" height="48"/></svg>';
                          }}
                        />
                      ) : isPdf ? (
                        <FileText className="w-6 h-6 text-rose-500" />
                      ) : (
                        <File className="w-6 h-6 text-blue-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4
                          className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate"
                          title={file.name}
                        >
                          {file.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        {getCategoryBadge(file.category)}
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Live Public Link Input Bar */}
                  <div className="flex-1 max-w-md mx-0 md:mx-3">
                    <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                      <input
                        type="text"
                        readOnly
                        value={file.publicShareUrl}
                        className="flex-1 px-2.5 py-1 text-xs font-mono bg-transparent text-slate-800 dark:text-slate-200 truncate focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleCopyLink(file, e)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
                        title="Copy public link"
                      >
                        {copiedId === file.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right: Quick action buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 justify-end">
                    <a
                      href={file.publicShareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                      title="Open public view link in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedQrFile(file)}
                      className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                      title="View QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {file.downloadUrl && (
                      <a
                        href={file.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                        title="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteFile(file.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* QR Code Modal */}
      {selectedQrFile && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedQrFile(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xs w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 truncate">
              {selectedQrFile.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Scan with phone to open public link
            </p>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 inline-block mb-4 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  selectedQrFile.publicShareUrl
                )}&bgcolor=ffffff&color=0f172a`}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
            <button
              type="button"
              onClick={() => setSelectedQrFile(null)}
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
