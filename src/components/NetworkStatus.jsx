import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, AlertTriangle, CheckCircle2, RefreshCw, X, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Reusable Global Network Status Notification Component
 * 
 * Displays professional, responsive banners for:
 * - Offline State (Red banner, WifiOff icon, retry action)
 * - Slow Network State (Amber/Orange banner, Alert icon, dismissible)
 * - Restored State (Emerald green banner, auto-dismiss in 3.5s)
 * - Normal Connected State (Hidden, zero UI footprint)
 */
export const NetworkStatus = () => {
  const {
    isOnline,
    isSlow,
    status,
    isChecking,
    showRestoredToast,
    isSlowDismissed,
    dismissSlowWarning,
    checkConnection,
    effectiveType,
    latency,
  } = useNetworkStatus();

  // Determine what banner to display (Offline has highest priority)
  const isOffline = !isOnline || status === 'offline';
  const showSlowBanner = isOnline && (status === 'slow' || isSlow) && !isSlowDismissed && !showRestoredToast;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center">
      <AnimatePresence mode="wait">
        {/* 1. OFFLINE STATE: Red Warning Banner */}
        {isOffline && (
          <motion.div
            key="network-offline-banner"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            role="alert"
            aria-live="assertive"
            className="w-full pointer-events-auto bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl border-b border-red-800/40"
          >
            <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
              {/* Left: Icon and message */}
              <div className="flex items-center space-x-3 min-w-0">
                <div className="relative flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 backdrop-blur-sm shadow-inner">
                  <WifiOff className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-white ring-1 ring-red-600 animate-ping" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-2">
                    <span>No Internet Connection</span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase bg-white/20 rounded">
                      Offline
                    </span>
                  </p>
                  <p className="text-[11px] sm:text-xs text-red-100 font-normal truncate sm:whitespace-normal">
                    Please check your network and try again.
                  </p>
                </div>
              </div>

              {/* Right: Manual check / retry button */}
              <div className="flex items-center space-x-2 flex-shrink-0 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => checkConnection()}
                  disabled={isChecking}
                  aria-label="Check internet connection"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-red-700 hover:bg-red-50 active:bg-red-100 transition shadow-sm disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check Now'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. RESTORED STATE: Green Success Toast / Banner */}
        {!isOffline && showRestoredToast && (
          <motion.div
            key="network-restored-banner"
            initial={{ y: -80, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            role="status"
            aria-live="polite"
            className="w-full pointer-events-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl border-b border-emerald-800/40"
          >
            <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold tracking-wide">
                    Internet connection restored.
                  </p>
                  <p className="text-[11px] sm:text-xs text-emerald-100 hidden sm:block">
                    You are back online. All operations are working normally.
                  </p>
                </div>
              </div>

              <div className="flex items-center text-xs text-emerald-100 font-medium bg-white/10 px-2 py-0.5 rounded-full">
                <Wifi className="w-3.5 h-3.5 mr-1" />
                <span>Connected</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. SLOW NETWORK STATE: Amber/Orange Warning Banner */}
        {!isOffline && !showRestoredToast && showSlowBanner && (
          <motion.div
            key="network-slow-banner"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            role="alert"
            aria-live="polite"
            className="w-full pointer-events-auto bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-lg border-b border-amber-700/40"
          >
            <div className="max-w-7xl mx-auto px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3">
              {/* Left: Alert Icon & Message */}
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-semibold tracking-wide">
                      Your network is slow.
                    </p>
                    {effectiveType && (
                      <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-medium tracking-wider uppercase bg-white/20 rounded">
                        {effectiveType}
                      </span>
                    )}
                    {latency && latency > 0 && (
                      <span className="hidden lg:inline-block text-[11px] text-amber-100">
                        (~{latency}ms)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-100 truncate sm:whitespace-normal">
                    Some features may take longer to load. Please check your internet connection.
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-2 flex-shrink-0 ml-auto sm:ml-0">
                <button
                  type="button"
                  onClick={() => checkConnection()}
                  disabled={isChecking}
                  title="Test speed"
                  className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white/20 hover:bg-white/30 transition text-white"
                >
                  <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Checking...' : 'Check'}</span>
                </button>
                <button
                  type="button"
                  onClick={dismissSlowWarning}
                  aria-label="Dismiss slow network warning"
                  className="p-1 rounded-md text-amber-100 hover:text-white hover:bg-white/20 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkStatus;

