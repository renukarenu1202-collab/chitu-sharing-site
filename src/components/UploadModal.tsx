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
} from 'lucide-react';
import {
  importFromDriveLink,
  importFromGooglePhotosLink,
  uploadFileToGoogleDrive,
  extractDriveFileId,
  isGooglePhotosUrl,
  UploadedPhotoRecord,
} from '../services/upload';
import { DrivePhotoItem } from '../types/photos';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (record: UploadedPhotoRecord, photoItem?: DrivePhotoItem) => void;
  onError: (msg: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'device'>('link');

  // Link tab state
  const [sharedLink, setSharedLink] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Device upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [makePublic, setMakePublic] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Detect link type
  const isDriveLink = Boolean(extractDriveFileId(sharedLink));
  const isPhotosLink = isGooglePhotosUrl(sharedLink);

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharedLink.trim()) {
      setLinkError('Please paste a Google Photos or Google Drive shared link.');
      return;
    }

    setIsImporting(true);
    setLinkError(null);

    try {
      if (isDriveLink) {
        const result = await importFromDriveLink(sharedLink);
        onSuccess(result.record, result.photoItem);
        onClose();
      } else if (isPhotosLink || sharedLink.startsWith('http')) {
        const record = await importFromGooglePhotosLink(sharedLink, customTitle);
        onSuccess(record);
        onClose();
      } else {
        throw new Error(
          'Unrecognized link format. Please provide a valid Google Drive or Google Photos share link.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import photo link';
      setLinkError(msg);
      onError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onError('Please select a valid image file (JPEG, PNG, WEBP, etc.)');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    }
  };

  const handleDeviceUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const result = await uploadFileToGoogleDrive(selectedFile, makePublic);
      onSuccess(result.record, result.photoItem);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to upload photo to Google Drive';
      onError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Upload & Add Photo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use Google Photos or Drive shared link, or upload from device
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-2 p-1.5 m-6 mb-0 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
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
          <button
            type="button"
            onClick={() => setActiveTab('device')}
            className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'device'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileImage className="w-3.5 h-3.5" />
            <span>Upload from Device</span>
          </button>
        </div>

        {/* Tab 1: Shared Link Form */}
        {activeTab === 'link' && (
          <form onSubmit={handleLinkSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Google Photos or Google Drive Shared Link <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="Paste link (e.g. photos.app.goo.gl/... or drive.google.com/file/d/...)"
                  value={sharedLink}
                  onChange={(e) => {
                    setSharedLink(e.target.value);
                    setLinkError(null);
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Link type detection tag */}
              {sharedLink.trim() && (
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  {isDriveLink ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Google Drive Link Detected
                    </span>
                  ) : isPhotosLink ? (
                    <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Google Photos Shared Link Detected
                    </span>
                  ) : (
                    <span className="text-slate-500">Public image link detected</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Title / Caption <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Give this photo a title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Supported link examples */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Supported formats:
              </span>
              <p>• Google Photos public album or photo link (<code className="text-blue-500">photos.app.goo.gl/...</code>)</p>
              <p>• Google Drive share link (<code className="text-blue-500">drive.google.com/file/d/.../view</code>)</p>
            </div>

            {linkError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{linkError}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isImporting || !sharedLink.trim()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>Import & Open Showcase Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Upload from Device Form */}
        {activeTab === 'device' && (
          <div className="p-6 space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Click to select an image from your computer
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports JPEG, PNG, WEBP, GIF (up to 25 MB)
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {filePreview && (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                    />
                  )}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {selectedFile.name}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            {/* Make public checkbox */}
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
                  Automatically generate public shareable link
                </span>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                  The uploaded photo will be made viewable to anyone with the link immediately.
                </p>
              </div>
            </label>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || isUploading}
                onClick={handleDeviceUpload}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Uploading to Drive...</span>
                  </>
                ) : (
                  <>
                    <span>Upload & Open Showcase</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
