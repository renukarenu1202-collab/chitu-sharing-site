import React from 'react';
import { User } from 'firebase/auth';
import {
  Search,
  X,
  RefreshCw,
  LogOut,
  Globe,
  ImageIcon,
  Share2,
  Upload,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onLogout: () => void;
  onOpenUpload: () => void;
  onViewShowcase?: () => void;
  currentView: 'gallery' | 'showcase';
  uploadedCount: number;
  isRefreshing: boolean;
  totalPhotos: number;
  publicPhotosCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  searchQuery,
  onSearchChange,
  onRefresh,
  onLogout,
  onOpenUpload,
  onViewShowcase,
  currentView,
  uploadedCount,
  isRefreshing,
  totalPhotos,
  publicPhotosCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Google Photos inspired logo */}
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-blue-500 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Public Link Generator
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Images, PDFs & Documents
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-sm mx-1 sm:mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search photos by name..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons & User Info */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Primary Upload / Link Button */}
            <button
              type="button"
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload / Link Photo</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Showcase View Button if uploaded photos exist */}
            {uploadedCount > 0 && onViewShowcase && (
              <button
                type="button"
                onClick={onViewShowcase}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  currentView === 'showcase'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
                title="View Uploaded Photo Showcase"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Showcase</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-600 dark:text-purple-300 font-bold">
                  {uploadedCount}
                </span>
              </button>
            )}

            {/* Refresh button */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh photo library"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            {/* User profile dropdown or avatar */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className="hidden xl:block text-left text-xs max-w-[110px]">
                  <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {user.displayName || 'Google User'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
