import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  fetchDriveImages,
  makeFilePublic,
  revokeFilePublic,
  batchMakePublic,
  batchRevokePublic,
  getPublicViewerUrl,
} from './services/drive';
import {
  DrivePhotoItem,
  FilterType,
  SortOption,
  ViewMode,
} from './types/photos';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { PhotoCard } from './components/PhotoCard';
import { PhotoList } from './components/PhotoList';
import { LightboxModal } from './components/LightboxModal';
import { ShareModal } from './components/ShareModal';
import { ConfirmationModal, ConfirmationModalConfig } from './components/ConfirmationModal';
import { BatchActionBar } from './components/BatchActionBar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { UploadModal } from './components/UploadModal';
import { PhotoShowcasePage } from './components/PhotoShowcasePage';
import {
  getStoredUploads,
  removeStoredUpload,
  UploadedPhotoRecord,
} from './services/upload';
import {
  Globe,
  Lock,
  Grid,
  List,
  LayoutGrid,
  ArrowUpDown,
  Filter,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Plus,
  ExternalLink,
  Upload,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Gallery state
  const [photos, setPhotos] = useState<DrivePhotoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Controls state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Upload & Showcase Page state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedRecords, setUploadedRecords] = useState<UploadedPhotoRecord[]>(() =>
    getStoredUploads()
  );
  const [activeShowcasePhoto, setActiveShowcasePhoto] = useState<UploadedPhotoRecord | null>(null);
  const [currentView, setCurrentView] = useState<'gallery' | 'showcase'>('gallery');

  // Modals state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [sharePhoto, setSharePhoto] = useState<DrivePhotoItem | null>(null);
  const [confirmationConfig, setConfirmationConfig] = useState<ConfirmationModalConfig>({
    isOpen: false,
    type: 'make_public',
    title: '',
    description: '',
    itemCount: 0,
    confirmButtonText: '',
    onConfirm: () => {},
    onCancel: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch photos helper
  const loadPhotos = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setFetchError(null);

    try {
      const result = await fetchDriveImages({
        pageSize: 60,
      });
      setPhotos(result.items);
      setNextPageToken(result.nextPageToken);
    } catch (err: unknown) {
      console.error('Error fetching photos:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load photos from Google Drive';
      setFetchError(msg);
      // If unauthorized, show auth screen
      if (msg.includes('401') || msg.includes('Not authenticated')) {
        setNeedsAuth(true);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setNeedsAuth(false);
        loadPhotos(true);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, [loadPhotos]);

  // Sign In handler
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setNeedsAuth(false);
        addToast(`Signed in as ${res.user.displayName || res.user.email}`);
        await loadPhotos(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      if (!message.includes('popup-closed-by-user') && !message.includes('cancelled-popup-request')) {
        setAuthError(message);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign Out handler
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setPhotos([]);
      setSelectedIds(new Set());
      setNeedsAuth(true);
      addToast('Signed out successfully', 'info');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Load more pagination
  const handleLoadMore = async () => {
    if (!nextPageToken || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchDriveImages({
        pageToken: nextPageToken,
        pageSize: 60,
      });
      setPhotos((prev) => [...prev, ...result.items]);
      setNextPageToken(result.nextPageToken);
    } catch (err: unknown) {
      console.error('Failed to load more photos:', err);
      addToast('Failed to load more photos', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Selection handlers
  const handleToggleSelect = (photo: DrivePhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photo.id)) {
        next.delete(photo.id);
      } else {
        next.add(photo.id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Single Make Public Request (with mandatory confirmation dialog)
  const handleRequestMakePublic = (photo: DrivePhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmationConfig({
      isOpen: true,
      type: 'make_public',
      title: 'Make Photo Publicly Shareable?',
      description: `Create a public shareable link for "${photo.name}". Anyone on the internet with the link will be able to view and download this image without logging in.`,
      itemCount: 1,
      itemNames: [photo.name],
      confirmButtonText: 'Make Public & Create Link',
      confirmButtonColor: 'emerald',
      onCancel: () => {
        setConfirmationConfig((prev) => ({ ...prev, isOpen: false }));
      },
      onConfirm: async () => {
        try {
          setConfirmationConfig((prev) => ({ ...prev, isProcessing: true }));
          const perm = await makeFilePublic(photo.id);
          // Update photo state
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? {
                    ...p,
                    isPublic: true,
                    publicPermissionId: perm.id,
                    permissions: [...(p.permissions || []), perm],
                  }
                : p
            )
          );

          // Copy link to clipboard immediately for convenience
          const shareUrl = getPublicViewerUrl(photo.id);
          navigator.clipboard.writeText(shareUrl);
          addToast(`Public link created and copied to clipboard!`);
        } catch (err: unknown) {
          console.error('Error making photo public:', err);
          addToast(err instanceof Error ? err.message : 'Failed to make photo public', 'error');
        } finally {
          setConfirmationConfig((prev) => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
    });
  };

  // Single Revoke Public Request (with mandatory confirmation dialog)
  const handleRequestRevokePublic = (photo: DrivePhotoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmationConfig({
      isOpen: true,
      type: 'revoke_public',
      title: 'Revoke Public Access?',
      description: `Revoke the public share link for "${photo.name}". Anyone who previously had the link will no longer be able to view or download this image.`,
      itemCount: 1,
      itemNames: [photo.name],
      confirmButtonText: 'Revoke Public Link',
      confirmButtonColor: 'amber',
      onCancel: () => {
        setConfirmationConfig((prev) => ({ ...prev, isOpen: false }));
      },
      onConfirm: async () => {
        try {
          setConfirmationConfig((prev) => ({ ...prev, isProcessing: true }));
          await revokeFilePublic(photo.id, photo.publicPermissionId);
          // Update photo state
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? {
                    ...p,
                    isPublic: false,
                    publicPermissionId: null,
                    permissions: (p.permissions || []).filter((perm) => perm.type !== 'anyone'),
                  }
                : p
            )
          );
          addToast(`Public link revoked. "${photo.name}" is now private.`);
        } catch (err: unknown) {
          console.error('Error revoking public access:', err);
          addToast(err instanceof Error ? err.message : 'Failed to revoke public access', 'error');
        } finally {
          setConfirmationConfig((prev) => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
    });
  };

  // Batch Make Public (with mandatory confirmation dialog)
  const handleRequestBatchMakePublic = () => {
    const targetPhotos = photos.filter((p) => selectedIds.has(p.id) && !p.isPublic);
    if (targetPhotos.length === 0) return;

    setConfirmationConfig({
      isOpen: true,
      type: 'make_public',
      title: `Make ${targetPhotos.length} Photos Publicly Shareable?`,
      description: `Generate public shareable links for all ${targetPhotos.length} selected photos. Anyone with the generated links will be able to view them.`,
      itemCount: targetPhotos.length,
      itemNames: targetPhotos.map((p) => p.name),
      confirmButtonText: `Make All ${targetPhotos.length} Public`,
      confirmButtonColor: 'emerald',
      onCancel: () => {
        setConfirmationConfig((prev) => ({ ...prev, isOpen: false }));
      },
      onConfirm: async () => {
        try {
          setConfirmationConfig((prev) => ({ ...prev, isProcessing: true }));
          const ids = targetPhotos.map((p) => p.id);
          const result = await batchMakePublic(ids);

          // Update state with newly made public items
          const successfulSet = new Set(result.success);
          setPhotos((prev) =>
            prev.map((p) =>
              successfulSet.has(p.id)
                ? {
                    ...p,
                    isPublic: true,
                    permissions: [
                      ...(p.permissions || []),
                      { id: 'anyoneWithLink', type: 'anyone', role: 'reader' },
                    ],
                  }
                : p
            )
          );

          addToast(`Successfully made ${result.success.length} photos public!`);
          if (result.failed.length > 0) {
            addToast(`Failed on ${result.failed.length} photos`, 'error');
          }
        } catch (err: unknown) {
          console.error('Batch make public error:', err);
          addToast(err instanceof Error ? err.message : 'Batch operation failed', 'error');
        } finally {
          setConfirmationConfig((prev) => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
    });
  };

  // Batch Revoke Public (with mandatory confirmation dialog)
  const handleRequestBatchRevokePublic = () => {
    const targetPhotos = photos.filter((p) => selectedIds.has(p.id) && p.isPublic);
    if (targetPhotos.length === 0) return;

    setConfirmationConfig({
      isOpen: true,
      type: 'revoke_public',
      title: `Revoke Public Access for ${targetPhotos.length} Photos?`,
      description: `Remove public share links from ${targetPhotos.length} selected photos. They will immediately become private to your Google account.`,
      itemCount: targetPhotos.length,
      itemNames: targetPhotos.map((p) => p.name),
      confirmButtonText: `Revoke All ${targetPhotos.length}`,
      confirmButtonColor: 'amber',
      onCancel: () => {
        setConfirmationConfig((prev) => ({ ...prev, isOpen: false }));
      },
      onConfirm: async () => {
        try {
          setConfirmationConfig((prev) => ({ ...prev, isProcessing: true }));
          const items = targetPhotos.map((p) => ({
            fileId: p.id,
            permissionId: p.publicPermissionId,
          }));
          const result = await batchRevokePublic(items);

          const successfulSet = new Set(result.success);
          setPhotos((prev) =>
            prev.map((p) =>
              successfulSet.has(p.id)
                ? {
                    ...p,
                    isPublic: false,
                    publicPermissionId: null,
                    permissions: (p.permissions || []).filter((perm) => perm.type !== 'anyone'),
                  }
                : p
            )
          );

          addToast(`Revoked public access on ${result.success.length} photos.`);
          if (result.failed.length > 0) {
            addToast(`Failed to revoke on ${result.failed.length} photos`, 'error');
          }
        } catch (err: unknown) {
          console.error('Batch revoke error:', err);
          addToast(err instanceof Error ? err.message : 'Batch revoke failed', 'error');
        } finally {
          setConfirmationConfig((prev) => ({ ...prev, isOpen: false, isProcessing: false }));
        }
      },
    });
  };

  // Upload handlers
  const handleUploadSuccess = (record: UploadedPhotoRecord, photoItem?: DrivePhotoItem) => {
    setUploadedRecords(getStoredUploads());
    setActiveShowcasePhoto(record);
    setCurrentView('showcase'); // Navigate to the separate dedicated page
    if (photoItem) {
      setPhotos((prev) => [photoItem, ...prev.filter((p) => p.id !== photoItem.id)]);
    }
    addToast('Photo ready! Now viewing on dedicated Showcase Page.');
  };

  const handleDeleteUploadRecord = (id: string) => {
    removeStoredUpload(id);
    const updated = getStoredUploads();
    setUploadedRecords(updated);
    if (activeShowcasePhoto?.id === id) {
      if (updated.length > 0) {
        setActiveShowcasePhoto(updated[0]);
      } else {
        setActiveShowcasePhoto(null);
        setCurrentView('gallery');
      }
    }
    addToast('Removed from showcase.', 'info');
  };

  const handleViewShowcase = (record?: UploadedPhotoRecord) => {
    if (record) {
      setActiveShowcasePhoto(record);
    } else if (uploadedRecords.length > 0) {
      setActiveShowcasePhoto(uploadedRecords[0]);
    }
    setCurrentView('showcase');
  };

  // Filter & Sort calculation
  const filteredAndSortedPhotos = useMemo(() => {
    let result = [...photos];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.imageMediaMetadata?.cameraModel &&
            p.imageMediaMetadata.cameraModel.toLowerCase().includes(q))
      );
    }

    // Public / Private tab filter
    if (filterType === 'public') {
      result = result.filter((p) => p.isPublic);
    } else if (filterType === 'private') {
      result = result.filter((p) => !p.isPublic);
    }

    // Sort order
    result.sort((a, b) => {
      if (sortOption === 'newest') {
        const timeA = new Date(a.createdTime || a.modifiedTime || 0).getTime();
        const timeB = new Date(b.createdTime || b.modifiedTime || 0).getTime();
        return timeB - timeA;
      }
      if (sortOption === 'oldest') {
        const timeA = new Date(a.createdTime || a.modifiedTime || 0).getTime();
        const timeB = new Date(b.createdTime || b.modifiedTime || 0).getTime();
        return timeA - timeB;
      }
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'size') {
        const sizeA = parseInt(a.size || '0', 10);
        const sizeB = parseInt(b.size || '0', 10);
        return sizeB - sizeA;
      }
      return 0;
    });

    return result;
  }, [photos, searchQuery, filterType, sortOption]);

  const publicCount = useMemo(() => photos.filter((p) => p.isPublic).length, [photos]);
  const privateCount = useMemo(() => photos.length - publicCount, [photos, publicCount]);

  const selectedPhotosList = useMemo(
    () => photos.filter((p) => selectedIds.has(p.id)),
    [photos, selectedIds]
  );

  // If unauthenticated, show the official Google Sign-In view
  if (needsAuth) {
    return <LoginView onLogin={handleLogin} isLoading={isLoggingIn} error={authError} />;
  }

  // If in showcase view and photo is selected, render the dedicated separate showcase page
  if (currentView === 'showcase' && activeShowcasePhoto) {
    return (
      <>
        <PhotoShowcasePage
          photo={activeShowcasePhoto}
          allUploads={uploadedRecords}
          onBackToGallery={() => setCurrentView('gallery')}
          onSelectPhoto={(photo) => setActiveShowcasePhoto(photo)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onDeleteRecord={handleDeleteUploadRecord}
        />

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
          onError={(msg) => addToast(msg, 'error')}
        />

        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      <Navbar
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => loadPhotos(false)}
        onLogout={handleLogout}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onViewShowcase={() => handleViewShowcase()}
        currentView={currentView}
        uploadedCount={uploadedRecords.length}
        isRefreshing={isRefreshing}
        totalPhotos={photos.length}
        publicPhotosCount={publicCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls Bar: Filter tabs, Sort dropdown, View toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Photos ({photos.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('public')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'public'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Links ({publicCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType('private')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'private'
                  ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Private ({privateCount})</span>
            </button>
          </div>

          {/* Right actions: Sorting & View mode */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                aria-label="Sort photos by"
                className="bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none font-medium cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size">File Size</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Compact Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="aspect-4/3 rounded-2xl bg-slate-200 dark:bg-slate-800/60 animate-pulse border border-slate-200/60 dark:border-slate-800"
              />
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && fetchError && (
          <div className="max-w-md mx-auto my-16 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-lg text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Could not load images
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              {fetchError}
            </p>
            <button
              type="button"
              onClick={() => loadPhotos(true)}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !fetchError && filteredAndSortedPhotos.length === 0 && (
          <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              {searchQuery ? 'No matching photos found' : 'No photos found in Google Photos/Drive'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {searchQuery
                ? `No images matched "${searchQuery}". Try searching with a different term.`
                : 'Upload some images to Google Drive or Google Photos, then click refresh to view and generate shareable links.'}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload or Import Photo Link</span>
                </button>
                <a
                  href="https://photos.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors"
                >
                  <span>Open Google Photos</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Photos Grid / List View */}
        {!isLoading && !fetchError && filteredAndSortedPhotos.length > 0 && (
          <>
            {viewMode === 'list' ? (
              <PhotoList
                photos={filteredAndSortedPhotos}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onClick={(photo) => {
                  const idx = filteredAndSortedPhotos.findIndex((p) => p.id === photo.id);
                  setLightboxIndex(idx);
                }}
                onShare={(photo, e) => {
                  e.stopPropagation();
                  setSharePhoto(photo);
                }}
                onRequestMakePublic={handleRequestMakePublic}
                onRequestRevokePublic={handleRequestRevokePublic}
              />
            ) : (
              <div
                className={`grid gap-4 ${
                  viewMode === 'compact'
                    ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                }`}
              >
                {filteredAndSortedPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    isSelected={selectedIds.has(photo.id)}
                    onToggleSelect={handleToggleSelect}
                    onClick={(p) => {
                      const idx = filteredAndSortedPhotos.findIndex((item) => item.id === p.id);
                      setLightboxIndex(idx);
                    }}
                    onShare={(p, e) => {
                      e.stopPropagation();
                      setSharePhoto(p);
                    }}
                    onRequestMakePublic={handleRequestMakePublic}
                  />
                ))}
              </div>
            )}

            {/* Pagination / Load more */}
            {nextPageToken && (
              <div className="mt-10 mb-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
                      <span>Loading more photos...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span>Load More Photos</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedPhotos={selectedPhotosList}
        allPhotosCount={photos.length}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onRequestBatchMakePublic={handleRequestBatchMakePublic}
        onRequestBatchRevokePublic={handleRequestBatchRevokePublic}
      />

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <LightboxModal
          photos={filteredAndSortedPhotos}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onSelectIndex={(idx) => setLightboxIndex(idx)}
          onOpenShareModal={(photo) => setSharePhoto(photo)}
          onRequestMakePublic={handleRequestMakePublic}
          onRequestRevokePublic={handleRequestRevokePublic}
        />
      )}

      {/* Dedicated Share Modal */}
      <ShareModal
        photo={sharePhoto}
        isOpen={sharePhoto !== null}
        onClose={() => setSharePhoto(null)}
        onRequestMakePublic={handleRequestMakePublic}
        onRequestRevokePublic={handleRequestRevokePublic}
      />

      {/* Mandatory User Confirmation Modal for Destructive/Mutating Operations */}
      <ConfirmationModal {...confirmationConfig} />

      {/* Upload & Link Import Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        onError={(msg) => addToast(msg, 'error')}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
