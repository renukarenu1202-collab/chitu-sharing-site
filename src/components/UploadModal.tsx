import React, { useState, useRef } from 'react';
import {
  X,
  Link,
  Upload,
  Globe,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Sparkles,
  ArrowRight,
  Trash2,
  Layers,
  Files,
  ListPlus,
} from 'lucide-react';
import {
  importFromDriveLink,
  importFromGooglePhotosLink,
  uploadFileToGoogleDrive,
  uploadBulkFilesToGoogleDrive,
  importBulkLinks,
  extractDriveFileId,
  isGooglePhotosUrl,
  UploadedPhotoRecord,
} from '../services/upload';
import { DrivePhotoItem } from '../types/photos';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    record: UploadedPhotoRecord,
    photoItem?: DrivePhotoItem,
    additionalItems?: Array<{ record: UploadedPhotoRecord; photoItem?: DrivePhotoItem }>
  ) => void;
  onError: (msg: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<'device' | 'link'>('device');

  // Device bulk upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [makePublic, setMakePublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    index: number;
    total: number;
    currentFileName: string;
    percent: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link import state
  const [isBulkLinkMode, setIsBulkLinkMode] = useState(false);
  const [sharedLink, setSharedLink] = useState('');
  const [bulkLinksText, setBulkLinksText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Single link helpers
  const isDriveLink = Boolean(extractDriveFileId(sharedLink));
  const isPhotosLink = isGooglePhotosUrl(sharedLink);

  // Detected bulk links count
  const detectedBulkLinks = bulkLinksText
    .split(/[\n\r,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http'));

  const handleFilesSelected = (filesList: FileList | File[]) => {
    const newValidFiles: File[] = [];
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      if (file.type.startsWith('image/')) {
        newValidFiles.push(file);
      }
    }

    if (newValidFiles.length === 0) {
      onError('Please select valid image files (JPEG, PNG, WEBP, GIF, etc.)');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...newValidFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Execute Bulk Upload
  const handleBulkUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({
      index: 1,
      total: selectedFiles.length,
      currentFileName: selectedFiles[0].name,
      percent: 0,
    });

    try {
      if (selectedFiles.length === 1) {
        // Single file upload
        const result = await uploadFileToGoogleDrive(selectedFiles[0], makePublic);
        onSuccess(result.record, result.photoItem);
        onClose();
      } else {
        // Multi-file bulk upload
        const result = await uploadBulkFilesToGoogleDrive(
          selectedFiles,
          makePublic,
          (progressInfo) => {
            setUploadProgress(progressInfo);
          }
        );

        if (result.successful.length > 0) {
          const first = result.successful[0];
          const remaining = result.successful.slice(1);
          onSuccess(first.record, first.photoItem, remaining);
          onClose();
        } else if (result.failed.length > 0) {
          throw new Error(`Failed to upload ${result.failed.length} files.`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk upload failed';
      onError(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Execute Link Import (Single or Bulk)
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsImporting(true);
    setLinkError(null);

    try {
      if (isBulkLinkMode) {
        if (detectedBulkLinks.length === 0) {
          throw new Error('Please paste at least one valid Google Photos or Drive link.');
        }

        const result = await importBulkLinks(bulkLinksText);
        if (result.successful.length > 0) {
          const first = result.successful[0];
          const remaining = result.successful.slice(1).map((rec) => ({ record: rec }));
          onSuccess(first, undefined, remaining);
          onClose();
        } else {
          throw new Error('None of the provided links could be imported.');
        }
      } else {
        // Single link import
        if (!sharedLink.trim()) {
          throw new Error('Please enter a Google Photos or Google Drive link.');
        }

        if (isDriveLink) {
          const res = await importFromDriveLink(sharedLink);
          onSuccess(res.record, res.photoItem);
          onClose();
        } else if (isPhotosLink || sharedLink.startsWith('http')) {
          const record = await importFromGooglePhotosLink(sharedLink, customTitle);
          onSuccess(record);
          onClose();
        } else {
          throw new Error('Please enter a valid Google Photos or Google Drive link.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import link(s)';
      setLinkError(msg);
      onError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const totalSelectedBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl transition-all flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Files className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Upload & Import Photos (Bulk Supported)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload multiple images at once or import shared Google links
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading || isImporting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 mx-6 mt-6 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'device'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Files className="w-3.5 h-3.5" />
            <span>Upload Files ({selectedFiles.length > 0 ? selectedFiles.length : 'Bulk'})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'link'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Shared Link Import</span>
          </button>
        </div>

        {/* Tab 1: Device Bulk Upload Form */}
        {activeTab === 'device' && (
          <div className="p-6 space-y-4 flex-1">
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) handleFilesSelected(e.target.files);
              }}
              className="hidden"
            />

            {/* Drag & Drop Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drag & drop multiple photos here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Select 1, 10, or 50+ photos at once (JPEG, PNG, WEBP, GIF)
              </p>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 px-1">
                  <span>
                    Selected Photos ({selectedFiles.length}) •{' '}
                    {(totalSelectedBytes / (1024 * 1024)).toFixed(2)} MB total
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    disabled={isUploading}
                    className="text-rose-500 hover:text-rose-600 text-xs font-medium cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 rounded-xl">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileImage className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px] sm:max-w-xs">
                          {file.name}
                        </span>
                        <span className="text-slate-400 text-[11px] shrink-0">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={isUploading}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Public Link option checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 cursor-pointer">
              <input
                type="checkbox"
                checked={makePublic}
                onChange={(e) => setMakePublic(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs text-emerald-900 dark:text-emerald-300">
                <span className="font-semibold flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  Automatically generate public shareable links for all uploads
                </span>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  Anyone with the generated links will be able to view these photos immediately.
                </p>
              </div>
            </label>

            {/* Live Upload Progress Indicator */}
            {isUploading && uploadProgress && (
              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                  <span className="truncate max-w-[260px]">
                    Uploading {uploadProgress.index} of {uploadProgress.total}:{' '}
                    <span className="font-mono text-[11px]">{uploadProgress.currentFileName}</span>
                  </span>
                  <span>{uploadProgress.percent}%</span>
                </div>
                <div className="w-full bg-blue-200 dark:bg-blue-900/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedFiles.length === 0 || isUploading}
                onClick={handleBulkUpload}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Uploading {selectedFiles.length} Photos...</span>
                  </>
                ) : (
                  <>
                    <span>Upload {selectedFiles.length > 0 ? `${selectedFiles.length} Photos` : 'Photos'} & Open Showcase</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Shared Link Import Form (Single or Bulk Links) */}
        {activeTab === 'link' && (
          <form onSubmit={handleLinkSubmit} className="p-6 space-y-4 flex-1">
            {/* Toggle between Single and Bulk link paste */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isBulkLinkMode ? 'Paste Multiple Links (One per line)' : 'Google Photos or Drive Link'}
              </label>
              <button
                type="button"
                onClick={() => setIsBulkLinkMode(!isBulkLinkMode)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer flex items-center gap-1"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>{isBulkLinkMode ? 'Switch to Single Link' : 'Bulk Paste Multiple Links'}</span>
              </button>
            </div>

            {isBulkLinkMode ? (
              <div>
                <textarea
                  rows={5}
                  placeholder={`Paste multiple links here, one per line:\nhttps://photos.app.goo.gl/...\nhttps://drive.google.com/file/d/.../view`}
                  value={bulkLinksText}
                  onChange={(e) => {
                    setBulkLinksText(e.target.value);
                    setLinkError(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Detected links: {detectedBulkLinks.length}</span>
                  <span>Separate links with newlines or commas</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  placeholder="Paste link (photos.app.goo.gl/... or drive.google.com/file/d/...)"
                  value={sharedLink}
                  onChange={(e) => {
                    setSharedLink(e.target.value);
                    setLinkError(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />

                {sharedLink.trim() && (
                  <div className="flex items-center gap-2 text-[11px]">
                    {isDriveLink ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Google Drive Link Detected
                      </span>
                    ) : isPhotosLink ? (
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Google Photos Shared Link Detected
                      </span>
                    ) : (
                      <span className="text-slate-500">Public link detected</span>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Custom Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Give this photo a title..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Helpful instructions */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Supported formats:
              </span>
              <p>• Google Photos public shared albums or links (<code className="text-blue-500">photos.app.goo.gl/...</code>)</p>
              <p>• Google Drive shareable links (<code className="text-blue-500">drive.google.com/file/d/.../view</code>)</p>
            </div>

            {linkError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{linkError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isImporting}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isImporting || (isBulkLinkMode ? detectedBulkLinks.length === 0 : !sharedLink.trim())}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>{isBulkLinkMode ? `Import ${detectedBulkLinks.length} Links` : 'Import & Open Showcase'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
