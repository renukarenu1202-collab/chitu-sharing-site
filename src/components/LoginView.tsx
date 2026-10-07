import React from 'react';
import { Globe, ShieldCheck, Share2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, isLoading, error }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-rose-500 to-blue-500 p-1 shadow-xl mb-6">
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[22px] flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl mb-3">
          Public Link Generator
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed">
          Bulk upload images, PDFs, and documents or import shared links to generate instant public viewable links.
        </p>

        {/* Feature cards preview */}
        <div className="grid grid-cols-1 gap-3 text-left mb-8">
          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Bulk Upload: Images, PDFs & Docs
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload multiple files or paste links to get public links for all of them at once.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Direct Embed & QR Code
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Get direct CDN URLs, markdown, HTML tags, and phone-scannable QR codes.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Secure & Revocable
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Full permission control with explicit confirmations before sharing or revoking.
              </p>
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Official Google Sign-In Button */}
        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            onClick={onLogin}
            disabled={isLoading}
            className="w-full max-w-xs flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm shadow-sm hover:shadow transition-all duration-200 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-blue-600 rounded-full animate-spin" />
            ) : (
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                className="w-5 h-5 shrink-0"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            )}
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>

          <p className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
            Requires Google Drive & Photos read access to display images and create links.
          </p>
        </div>
      </div>
    </div>
  );
};
