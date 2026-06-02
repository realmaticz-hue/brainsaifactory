/**
 * OAuth Security Utilities
 * 
 * Provides utilities for ensuring secure OAuth flows with HTTPS enforcement
 */

/**
 * Check if the current page is accessed via HTTPS
 * @returns true if HTTPS, false if HTTP
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return true; // SSR context
  
  // Consider localhost as secure for development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return true;
  }
  
  return window.location.protocol === 'https:';
}

/**
 * Get the current protocol (http or https)
 * @returns 'https' | 'http'
 */
export function getCurrentProtocol(): 'https' | 'http' {
  if (typeof window === 'undefined') return 'https';
  return window.location.protocol.replace(':', '') as 'https' | 'http';
}

/**
 * Get the OAuth redirect URI with forced HTTPS
 * @param path - The callback path (default: '/oauth-callback.html')
 * @returns The full HTTPS redirect URI
 */
export function getSecureRedirectUri(path: string = '/oauth-callback.html'): string {
  if (typeof window === 'undefined') return '';
  
  const protocol = isSecureContext() ? 'https:' : 'https:'; // Always force HTTPS
  const host = window.location.host;
  return `${protocol}//${host}${path}`;
}

/**
 * Validate if a redirect URI is secure (HTTPS)
 * @param uri - The URI to validate
 * @returns true if secure, false otherwise
 */
export function isSecureRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    // Localhost is considered secure for development
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return true;
    }
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get security status information
 * @returns Object with security status details
 */
export function getSecurityStatus() {
  if (typeof window === 'undefined') {
    return {
      isSecure: true,
      protocol: 'https' as const,
      message: 'Server-side context',
      canUseOAuth: true,
    };
  }
  
  const protocol = getCurrentProtocol();
  const isSecure = isSecureContext();
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  return {
    isSecure,
    protocol,
    hostname: window.location.hostname,
    origin: window.location.origin,
    redirectUri: getSecureRedirectUri(),
    message: isSecure 
      ? 'Secure connection (HTTPS) - OAuth ready' 
      : isLocalhost
        ? 'Local development - OAuth may work'
        : 'Insecure connection (HTTP) - OAuth will fail on most platforms',
    canUseOAuth: isSecure || isLocalhost,
    warnings: !isSecure && !isLocalhost 
      ? [
          'Facebook requires HTTPS for OAuth',
          'Instagram requires HTTPS for OAuth',
          'Twitter/X requires HTTPS for OAuth',
          'LinkedIn requires HTTPS for OAuth',
          'Most social platforms block HTTP OAuth for security',
        ]
      : [],
  };
}

/**
 * Check if OAuth is available for a specific platform
 * @param platform - The social media platform
 * @returns Object with availability status and reason
 */
export function checkOAuthAvailability(platform: string): {
  available: boolean;
  reason: string;
  requiresHttps: boolean;
} {
  const platformsRequiringHttps = [
    'facebook',
    'instagram',
    'twitter',
    'linkedin',
    'google',
    'youtube',
    'tiktok',
    'pinterest',
  ];
  
  const requiresHttps = platformsRequiringHttps.includes(platform.toLowerCase());
  const isSecure = isSecureContext();
  
  if (requiresHttps && !isSecure) {
    return {
      available: false,
      reason: `${platform} requires HTTPS for OAuth. Please access this app via https://`,
      requiresHttps: true,
    };
  }
  
  return {
    available: true,
    reason: 'OAuth available',
    requiresHttps,
  };
}

/**
 * Log security information to console (for debugging)
 */
export function logSecurityInfo(): void {
  const status = getSecurityStatus();
  console.group('🔒 OAuth Security Status');
  console.log('Protocol:', status.protocol);
  console.log('Origin:', status.origin);
  console.log('Is Secure:', status.isSecure);
  console.log('Can Use OAuth:', status.canUseOAuth);
  console.log('Redirect URI:', status.redirectUri);
  console.log('Message:', status.message);
  if (status.warnings.length > 0) {
    console.warn('Warnings:', status.warnings);
  }
  console.groupEnd();
}

/**
 * Force HTTPS redirect (use with caution - may break local development)
 * @param allowLocalhost - If true, localhost won't be redirected (default: true)
 */
export function forceHttpsRedirect(allowLocalhost: boolean = true): void {
  if (typeof window === 'undefined') return;
  
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (allowLocalhost && isLocalhost) {
    return; // Don't redirect localhost
  }
  
  if (window.location.protocol === 'http:') {
    const httpsUrl = window.location.href.replace('http://', 'https://');
    console.warn('[OAuth Security] Redirecting to HTTPS:', httpsUrl);
    window.location.replace(httpsUrl);
  }
}