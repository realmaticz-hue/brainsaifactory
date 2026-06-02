import React, { useEffect } from 'react';
import { serverFetch } from '../utils/serverFetch';

interface HealthCheckProps {
  onHealthy?: () => void;
  onUnhealthy?: (error: string) => void;
}

/**
 * ServerHealthCheck - Silent background health monitoring
 *
 * This component runs a silent health check in the background but NEVER
 * shows UI to the user. The app is designed to work perfectly fine without
 * a backend server (all features have demo modes), so there's no need to
 * alarm users with connection errors.
 *
 * The check runs once on mount to notify callbacks, but never blocks the UI.
 */
export function ServerHealthCheck({ onHealthy, onUnhealthy }: HealthCheckProps) {
  useEffect(() => {
    // Silent background check - never blocks UI or shows errors
    const checkHealth = async () => {
      try {
        // Set a 3-second timeout for the fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await serverFetch('/health', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          console.log('[HealthCheck] ✅ Backend server is available');
          onHealthy?.();
        } else {
          // Server returned error - app continues in demo mode
          onUnhealthy?.('Server unavailable');
        }
      } catch (err: any) {
        // Server not reachable - this is normal and expected
        // App works perfectly fine without backend (all features have demo modes)
        onUnhealthy?.('Server unavailable');
      }
    };

    // Run check after a small delay to avoid blocking initial render
    const timer = setTimeout(checkHealth, 1000);
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  // Never render any UI - app works fine without backend
  return null;
}
