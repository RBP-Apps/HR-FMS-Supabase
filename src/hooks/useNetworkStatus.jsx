import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  verifyInternetConnectivity,
  getNetworkInformation,
  setupPassiveNetworkMonitoring,
  NETWORK_THRESHOLDS,
} from '../utils/networkMonitor';

const NetworkContext = createContext(null);

export const NetworkProvider = ({ children }) => {
  // Initial connectivity
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSlow, setIsSlow] = useState(() => {
    const info = getNetworkInformation();
    return info.isSlow;
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);
  const [isSlowDismissed, setIsSlowDismissed] = useState(false);

  // Network stats
  const [effectiveType, setEffectiveType] = useState(() => getNetworkInformation().effectiveType);
  const [rtt, setRtt] = useState(() => getNetworkInformation().rtt);
  const [downlink, setDownlink] = useState(() => getNetworkInformation().downlink);
  const [lastLatency, setLastLatency] = useState(null);

  // References to track offline history without triggering re-renders
  const wasOfflineRef = useRef(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const latencySamplesRef = useRef([]);
  const restoredTimerRef = useRef(null);
  const debounceVerifyTimerRef = useRef(null);

  // Clear restored toast timer on unmount
  useEffect(() => {
    return () => {
      if (restoredTimerRef.current) clearTimeout(restoredTimerRef.current);
      if (debounceVerifyTimerRef.current) clearTimeout(debounceVerifyTimerRef.current);
    };
  }, []);

  // Update hardware network info
  const refreshHardwareInfo = useCallback(() => {
    const info = getNetworkInformation();
    setEffectiveType(info.effectiveType);
    setRtt(info.rtt);
    setDownlink(info.downlink);

    // If hardware explicitly reports slow (2g/slow-2g or high RTT), flag slow
    if (info.isSlow) {
      setIsSlow(true);
    }
  }, []);

  // Show temporary restored message
  const triggerRestoredNotification = useCallback(() => {
    setShowRestoredToast(true);
    if (restoredTimerRef.current) clearTimeout(restoredTimerRef.current);
    restoredTimerRef.current = setTimeout(() => {
      setShowRestoredToast(false);
    }, 3500);
  }, []);

  // Manual or automatic connectivity check
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    try {
      const online = await verifyInternetConnectivity();
      setIsOnline(online);

      if (online) {
        if (wasOfflineRef.current) {
          wasOfflineRef.current = false;
          triggerRestoredNotification();
        }
        refreshHardwareInfo();
      } else {
        wasOfflineRef.current = true;
        setShowRestoredToast(false);
      }
      return online;
    } catch {
      setIsOnline(false);
      wasOfflineRef.current = true;
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [refreshHardwareInfo, triggerRestoredNotification]);

  // Handle passive latency samples from real application fetch calls
  const handleLatencySample = useCallback((duration) => {
    setLastLatency(Math.round(duration));

    const samples = latencySamplesRef.current;
    samples.push(duration);
    if (samples.length > NETWORK_THRESHOLDS.MAX_LATENCY_SAMPLES) {
      samples.shift();
    }

    const avgLatency = samples.reduce((acc, curr) => acc + curr, 0) / samples.length;
    const consecutiveSlow = samples.length >= 2 && samples.slice(-2).every(s => s >= NETWORK_THRESHOLDS.SLOW_API_LATENCY_MS);

    // Check if network is slow
    const hwInfo = getNetworkInformation();
    if (hwInfo.isSlow || avgLatency >= NETWORK_THRESHOLDS.SLOW_API_LATENCY_MS || consecutiveSlow) {
      setIsSlow(true);
    } else if (avgLatency <= NETWORK_THRESHOLDS.NORMAL_API_LATENCY_MS && !hwInfo.isSlow) {
      setIsSlow(false);
      setIsSlowDismissed(false); // Reset dismissal when network returns to normal
    }
  }, []);

  // Handle passive network failures from real application fetch calls
  const handleNetworkFailure = useCallback((error) => {
    // If navigator says offline, immediately mark offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      wasOfflineRef.current = true;
      return;
    }

    // Debounce verification check to avoid duplicate calls on network drops
    if (debounceVerifyTimerRef.current) {
      clearTimeout(debounceVerifyTimerRef.current);
    }

    debounceVerifyTimerRef.current = setTimeout(async () => {
      const verified = await verifyInternetConnectivity();
      if (!verified) {
        setIsOnline(false);
        wasOfflineRef.current = true;
      }
    }, 600);
  }, []);

  // Initialize listeners on mount
  useEffect(() => {
    // 1. Setup passive fetch observer with cleanup
    const unsubscribe = setupPassiveNetworkMonitoring({
      onLatencySample: handleLatencySample,
      onNetworkFailure: handleNetworkFailure,
    });

    // 2. Window online/offline events
    const handleWindowOnline = async () => {
      // Browser reports online, verify actual internet access
      const verified = await verifyInternetConnectivity();
      if (verified) {
        setIsOnline(true);
        if (wasOfflineRef.current) {
          wasOfflineRef.current = false;
          triggerRestoredNotification();
        }
        refreshHardwareInfo();
      } else {
        // False online (e.g. Wi-Fi connected but no WAN access)
        setIsOnline(false);
        wasOfflineRef.current = true;
      }
    };

    const handleWindowOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      setShowRestoredToast(false);
    };

    window.addEventListener('online', handleWindowOnline);
    window.addEventListener('offline', handleWindowOffline);

    // 3. NetworkInformation API change event (if supported)
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const handleConnectionChange = () => {
      refreshHardwareInfo();
    };

    if (conn && conn.addEventListener) {
      conn.addEventListener('change', handleConnectionChange);
    }

    // 4. Tab visibility change: re-verify if tab was hidden and comes back to foreground
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshHardwareInfo();
        // If we were offline or connection is questionable, verify
        if (!navigator.onLine || wasOfflineRef.current) {
          checkConnection();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      window.removeEventListener('online', handleWindowOnline);
      window.removeEventListener('offline', handleWindowOffline);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener('change', handleConnectionChange);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceVerifyTimerRef.current) {
        clearTimeout(debounceVerifyTimerRef.current);
      }
    };
  }, [handleLatencySample, handleNetworkFailure, refreshHardwareInfo, triggerRestoredNotification, checkConnection]);

  // Compute primary unified status
  let status = 'online';
  if (!isOnline) {
    status = 'offline';
  } else if (isSlow && !isSlowDismissed) {
    status = 'slow';
  }

  const dismissSlowWarning = useCallback(() => {
    setIsSlowDismissed(true);
  }, []);

  const value = {
    isOnline,
    isSlow,
    status,
    isChecking,
    showRestoredToast,
    effectiveType,
    rtt,
    downlink,
    latency: lastLatency,
    isSlowDismissed,
    dismissSlowWarning,
    checkConnection,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

/**
 * Custom hook to consume global network status anywhere in the application.
 * 
 * @returns {{
 *   isOnline: boolean,
 *   isSlow: boolean,
 *   status: 'online' | 'slow' | 'offline',
 *   isChecking: boolean,
 *   showRestoredToast: boolean,
 *   effectiveType: string | null,
 *   rtt: number | null,
 *   downlink: number | null,
 *   latency: number | null,
 *   isSlowDismissed: boolean,
 *   dismissSlowWarning: () => void,
 *   checkConnection: () => Promise<boolean>
 * }}
 */
export const useNetworkStatus = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    // Graceful fallback if used outside NetworkProvider
    const isOnlineNow = typeof navigator !== 'undefined' ? navigator.onLine : true;
    return {
      isOnline: isOnlineNow,
      isSlow: false,
      status: isOnlineNow ? 'online' : 'offline',
      isChecking: false,
      showRestoredToast: false,
      effectiveType: null,
      rtt: null,
      downlink: null,
      latency: null,
      isSlowDismissed: false,
      dismissSlowWarning: () => {},
      checkConnection: verifyInternetConnectivity,
    };
  }
  return context;
};

export default useNetworkStatus;

