import React, { useState } from 'react';
import {
  Globe,
  Lock,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  CheckSquare,
} from 'lucide-react';
import { DrivePhotoItem } from '../types/photos';
import { getPublicViewerUrl } from '../services/drive';

interface BatchActionBarProps {
  selectedPhotos: DrivePhotoItem[];
  allPhotosCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRequestBatchMakePublic: () => void;
  onRequestBatchRevokePublic: () => void;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedPhotos,
  allPhotosCount,
  onSelectAll,
  onClearSelection,
  onRequestBatchMakePublic,
  onRequestBatchRevokePublic,
}) => {
  const [copied, setCopied] = useState(false);

  if (selectedPhotos.length === 0) return null;

  const handleCopyAllLinks = () => {
    const lines = selectedPhotos.map((p) => {
      const url = getPublicViewerUrl(p.id);
      return `${p.name}: ${url}`;
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['File ID', 'File Name', 'Public Status', 'Share Link'].join(','),
      ...selectedPhotos.map((p) =>
        [
          `"${p.id}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          p.isPublic ? 'Public' : 'Private',
          `"${getPublicViewerUrl(p.id)}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `photos_share_links_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const countPublic = selectedPhotos.filter((p) => p.isPublic).length;
  const countPrivate = selectedPhotos.length - countPublic;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] sm:w-auto animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
            {selectedPhotos.length}
          </span>
          <span className="text-xs font-medium text-slate-200 whitespace-nowrap">
            selected
          </span>
          {selectedPhotos.length < allPhotosCount && (
            <button
              type="button"
              onClick={onSelectAll}
              className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer ml-1"
            >
              Select all ({allPhotosCount})
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Batch make public */}
          {countPrivate > 0 && (
            <button
              type="button"
              onClick={onRequestBatchMakePublic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title={`Make ${countPrivate} private photos public`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Make Public ({countPrivate})</span>
            </button>
          )}

          {/* Batch revoke */}
          {countPublic > 0 && (
            <button
              type="button"
              onClick={onRequestBatchRevokePublic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
              title={`Revoke public access for ${countPublic} photos`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Revoke ({countPublic})</span>
            </button>
          )}

          {/* Copy all links */}
          <button
            type="button"
            onClick={handleCopyAllLinks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Copy share links for all selected photos"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Links</span>
              </>
            )}
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Export CSV of selected links"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {/* Clear selection */}
          <button
            type="button"
            onClick={onClearSelection}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
