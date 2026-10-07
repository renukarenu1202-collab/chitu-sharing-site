import React, { useState, useRef } from 'react';
import {
  Upload,
  Link,
  Files,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  FileImage,
  File,
  X,
  ArrowRight,
  Globe,
  Trash2,
  ListPlus,
} from 'lucide-react';
import {
  uploadBulkFilesToGoogleDrive,
  importBulkLinks,
  getFileCategory,
  UploadedPhotoRecord,
} from '../services/upload';
import { DrivePhotoItem } from '../types/photos';

interface BulkUploadPanelProps {
  onSuccess: (
    records: UploadedPhotoRecord[],
    photoItems?: DrivePhotoItem[]
  ) => void;
  onError: (msg: string) => void;
}

export const BulkUploadPanel: React.FC<BulkUploadPanelProps> = ({
  onSuccess,
  onError,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'device' | 'links'>('device');

  // Option 1: Device Bulk Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    index: number;
    total: number;
    currentFileName: string;
    percent: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Option 2: Bulk Links
  const [bulkLinksText, setBulkLinksText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const detectedLinks = bulkLinksText
    .split(/[\n\r,]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http'));

  // File selection
  const handleFilesChosen = (filesList: FileList | File[]) => {
    const valid: File[] = [];
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      // Accept Images, PDFs, Docs, Text files
      valid.push(file);
    }
    if (valid.length === 0) {
      onError('Please select valid files (Images, PDFs, or Documents).');
      return;
    }
    setSelectedFiles((prev) => [...prev, ...valid]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
  };

  // Drag & drop handlers
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
      handleFilesChosen(e.dataTransfer.files);
    }
  };

  // Option 1 submit
  const handleStartDeviceUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({
      index: 1,
      total: selectedFiles.length,
      currentFileName: selectedFiles[0].name,
      percent: 0,
    });

    try {
      const result = await uploadBulkFilesToGoogleDrive(
        selectedFiles,
        true, // Always make public for shareable links
        (progressInfo) => {
          setUploadProgress(progressInfo);
        }
      );

      if (result.successful.length > 0) {
        const records = result.successful.map((s) => s.record);
        const photoItems = result.successful.map((s) => s.photoItem);
        setSelectedFiles([]);
        onSuccess(records, photoItems);
      } else if (result.failed.length > 0) {
        throw new Error(`Failed to upload ${result.failed.length} files.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      onError(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Option 2 submit
  const handleStartLinksImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (detectedLinks.length === 0) {
      setLinkError('Please paste at least one valid Google Drive or Google Photos link.');
      return;
    }

    setIsImporting(true);
    setLinkError(null);

    try {
      const result = await importBulkLinks(bulkLinksText);
      if (result.successful.length > 0) {
        setBulkLinksText('');
        onSuccess(result.successful);
      } else {
        throw new Error('None of the provided links could be processed.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import links';
      setLinkError(msg);
      onError(msg);
    } finally {
      setIsImporting(false);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8 transition-all">
      <div className="text-center max-w-xl mx-auto mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Upload Files & Get Public Viewable Links
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Choose one of the 2 options below to generate public shareable links for Images, PDFs, and Documents
        </p>
      </div>

      {/* 2 Core Options Switcher Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
        <button
          type="button"
          onClick={() => setSelectedMethod('device')}
          className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
            selectedMethod === 'device'
              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
          }`}
        >
          <div
            className={`p-3 rounded-xl shrink-0 ${
              selectedMethod === 'device'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Files className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Option 1
              </span>
              {selectedFiles.length > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {selectedFiles.length} ready
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              Upload Bulk Files from Device
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Select multiple Images, PDFs, and Docs directly from computer
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedMethod('links')}
          className={`flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
            selectedMethod === 'links'
              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
          }`}
        >
          <div
            className={`p-3 rounded-xl shrink-0 ${
              selectedMethod === 'links'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Link className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Option 2
              </span>
              {detectedLinks.length > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  {detectedLinks.length} links
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              Import Bulk Shared Links
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Paste multiple Google Photos or Google Drive shared links
            </p>
          </div>
        </button>
      </div>

      {/* Option 1 Body: Device Bulk Upload */}
      {selectedMethod === 'device' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,.pdf,application/pdf,.doc,.docx,.txt,.rtf,.odt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => {
              if (e.target.files) handleFilesChosen(e.target.files);
            }}
            className="hidden"
          />

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Drop bulk Images, PDFs, and Docs here, or click to browse
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports: 🖼️ Images (JPG, PNG, WEBP) • 📄 PDFs • 📝 Word & Docs (DOC, DOCX, TXT)
            </p>
            <button
              type="button"
              className="mt-3 px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs pointer-events-none"
            >
              Select Files
            </button>
          </div>

          {/* Selected Files List Preview */}
          {selectedFiles.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>
                  Ready to Upload: {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ({formatSize(totalBytes)})
                </span>
                <button
                  type="button"
                  onClick={handleClearFiles}
                  disabled={isUploading}
                  className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((file, idx) => {
                  const category = getFileCategory(file.name, file.type);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {category === 'image' ? (
                          <FileImage className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : category === 'pdf' ? (
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                        ) : (
                          <File className="w-4 h-4 text-blue-500 shrink-0" />
                        )}
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[280px]">
                          {file.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {category}
                        </span>
                        <span className="text-slate-400 text-[11px] shrink-0">
                          {formatSize(file.size)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        disabled={isUploading}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Upload Progress */}
              {isUploading && uploadProgress && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
                    <span className="truncate max-w-[280px]">
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

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isUploading || selectedFiles.length === 0}
                  onClick={handleStartDeviceUpload}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Generating Public Links...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      <span>Upload & Get Public Links for {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Option 2 Body: Bulk Links Import */}
      {selectedMethod === 'links' && (
        <form onSubmit={handleStartLinksImport} className="space-y-4 max-w-2xl mx-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Paste Bulk Links (One URL per line or comma-separated)
            </label>
            <textarea
              rows={5}
              placeholder={`Paste your Google Photos or Google Drive links here:\nhttps://photos.app.goo.gl/...\nhttps://drive.google.com/file/d/.../view\nhttps://docs.google.com/document/d/...`}
              value={bulkLinksText}
              onChange={(e) => {
                setBulkLinksText(e.target.value);
                setLinkError(null);
              }}
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {detectedLinks.length} valid link{detectedLinks.length !== 1 ? 's' : ''} detected
              </span>
              <span>Supports Google Drive files, Google Photos albums & images</span>
            </div>
          </div>

          {linkError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{linkError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isImporting || detectedLinks.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Processing Links...</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Import & Get Public Links for {detectedLinks.length} URL{detectedLinks.length !== 1 ? 's' : ''}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
