/**
 * Network Monitoring Utility
 * 
 * Provides:
 * 1. Safe, lightweight internet connectivity verification (with in-flight deduplication)
 * 2. Hardware / Browser NetworkInformation API reader (effectiveType, rtt, downlink)
 * 3. Passive fetch latency interceptor (measures existing API calls without making extra requests)
 * 4. False-positive offline prevention (distinguishes server 5xx from true network failure)
 */

// Latency & Speed Thresholds
export const NETWORK_THRESHOLDS = {
  SLOW_RTT_MS: 1500,           // NetworkInformation RTT >= 1500ms is considered slow
  SLOW_API_LATENCY_MS: 2800,   // API response time >= 2800ms is considered slow
  NORMAL_API_LATENCY_MS: 1200, // Latency <= 1200ms considered normalized
  PING_TIMEOUT_MS: 3500,       // Fast timeout for health pings to avoid hanging
  MAX_LATENCY_SAMPLES: 5,      // Sliding window size for passive latency tracking
};

// In-flight ping promise deduplication to prevent multiple simultaneous requests
let inFlightPing = null;

// Active listeners for passive monitoring
const latencyListeners = new Set();
const networkFailureListeners = new Set();
let isFetchIntercepted = false;

/**
 * Checks whether the browser is truly connected to the internet.
 * Uses navigator.onLine first, then verifies with a fast lightweight check.
 * Reuses in-flight promise if multiple callers request simultaneously.
 * 
 * @returns {Promise<boolean>} true if internet is reachable, false otherwise
 */
export async function verifyInternetConnectivity() {
  // If browser OS knows we are offline, trust it immediately
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  // Deduplicate concurrent checks
  if (inFlightPing) {
    return inFlightPing;
  }

  inFlightPing = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), NETWORK_THRESHOLDS.PING_TIMEOUT_MS);

      const supabaseUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '';
      const timestamp = Date.now();

      // Primary check: try Supabase auth health or fallback endpoint
      let isReachable = false;

      // 1. If Supabase URL is available, test its lightweight health endpoint
      if (supabaseUrl && supabaseUrl.startsWith('http')) {
        try {
          const res = await fetch(`${supabaseUrl}/auth/v1/health?_t=${timestamp}&_ping=1`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          });
          // Any response from the server (even 200, 401, or 500) proves WAN internet connectivity
          if (res) {
            isReachable = true;
          }
        } catch (supaErr) {
          // If aborted due to timeout, it's considered unreachable
          if (supaErr.name === 'AbortError') {
            clearTimeout(timeoutId);
            return false;
          }
          // If Supabase health failed with TypeError (e.g. CORS or DNS), fall back to public 204 endpoint
        }
      }

      // 2. Fallback / Universal check: Google generate_204 in no-cors mode
      // This is the universal internet check used by Chrome & Android OS.
      // In no-cors mode, it sends an HTTP GET and resolves with opaque response if internet is alive.
      // If internet is disconnected, it immediately rejects with TypeError.
      if (!isReachable) {
        try {
          await fetch(`https://www.google.com/generate_204?_t=${timestamp}&_ping=1`, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-store',
            signal: controller.signal,
          });
          isReachable = true;
        } catch (genErr) {
          // If both failed or timed out, we are offline
          isReachable = false;
        }
      }

      clearTimeout(timeoutId);
      return isReachable;
    } catch {
      return false;
    } finally {
      inFlightPing = null;
    }
  })();

  return inFlightPing;
}

/**
 * Reads browser NetworkInformation API (Chromium, Edge, Android)
 * Zero network overhead — uses browser's internal socket statistics.
 */
export function getNetworkInformation() {
  if (typeof navigator === 'undefined') {
    return { isSupported: false, effectiveType: null, rtt: null, downlink: null, isSlow: false };
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) {
    return { isSupported: false, effectiveType: null, rtt: null, downlink: null, isSlow: false };
  }

  const effectiveType = connection.effectiveType || null; // 'slow-2g', '2g', '3g', '4g'
  const rtt = typeof connection.rtt === 'number' ? connection.rtt : null;
  const downlink = typeof connection.downlink === 'number' ? connection.downlink : null;
  const saveData = !!connection.saveData;

  // Determine if connection is slow based on hardware/network stats
  const isSlow =
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    (rtt !== null && rtt >= NETWORK_THRESHOLDS.SLOW_RTT_MS) ||
    (downlink !== null && downlink > 0 && downlink < 0.4);

  return {
    isSupported: true,
    effectiveType,
    rtt,
    downlink,
    saveData,
    isSlow,
    connection,
  };
}

/**
 * Passive network request subscriber.
 * Transparently wraps window.fetch to observe request durations and network drops.
 * Supports multiple subscribers and cleanup, fully compatible with React 18 StrictMode.
 * NEVER makes extra API calls!
 * 
 * @param {{ onLatencySample?: (duration: number, url: string) => void, onNetworkFailure?: (error: Error, duration: number, url: string) => void }} callbacks
 * @returns {() => void} Unsubscribe cleanup function
 */
export function setupPassiveNetworkMonitoring({ onLatencySample, onNetworkFailure } = {}) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  if (onLatencySample) latencyListeners.add(onLatencySample);
  if (onNetworkFailure) networkFailureListeners.add(onNetworkFailure);

  // Wrap window.fetch once
  if (!isFetchIntercepted) {
    isFetchIntercepted = true;
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      let rawUrl = '';
      try {
        if (typeof args[0] === 'string') {
          rawUrl = args[0];
        } else if (args[0] && typeof args[0].url === 'string') {
          rawUrl = args[0].url;
        } else if (args[0] && typeof args[0].href === 'string') {
          rawUrl = args[0].href;
        } else if (args[0]) {
          rawUrl = String(args[0]);
        }
      } catch {
        rawUrl = '';
      }

      // Ignore internal health pings from latency calculations and network failure events
      const isInternalPing = rawUrl.includes('_ping=1') || rawUrl.includes('generate_204') || rawUrl.includes('/auth/v1/health');

      const startTime = performance.now();

      try {
        const response = await originalFetch.apply(this, args);
        const duration = performance.now() - startTime;

        if (!isInternalPing && latencyListeners.size > 0) {
          latencyListeners.forEach((listener) => {
            try {
              listener(duration, rawUrl);
            } catch (err) {
              console.error('Error in latency listener:', err);
            }
          });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;
        const isAbort = error && error.name === 'AbortError';

        // Only notify when it's an unexpected network drop, not a user-initiated abort or internal ping
        if (!isInternalPing && !isAbort && networkFailureListeners.size > 0) {
          networkFailureListeners.forEach((listener) => {
            try {
              listener(error, duration, rawUrl);
            } catch (err) {
              console.error('Error in network failure listener:', err);
            }
          });
        }

        throw error;
      }
    };
  }

  // Return unsubscribe cleanup function
  return () => {
    if (onLatencySample) latencyListeners.delete(onLatencySample);
    if (onNetworkFailure) networkFailureListeners.delete(onNetworkFailure);
  };
}

