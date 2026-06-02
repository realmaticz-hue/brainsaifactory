// =============================================================================
// AUTHENTICATION — Supabase Auth Integration
// =============================================================================
//
// Provides authentication utilities for sign up, sign in, sign out, and
// session management using Supabase Auth.
//
// =============================================================================

import { projectId, publicAnonKey } from '../supabase/info';
import { serverFetch } from '../serverFetch';
import { saveUserProfile, getUserProfile, type UserProfile } from './blogDatabase';

// =============================================================================
// TYPES
// =============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// =============================================================================
// SESSION STORAGE
// =============================================================================

const SESSION_KEY = 'auth_session';
const SESSION_EXPIRY_KEY = 'auth_session_expiry';

/**
 * Save session to localStorage
 */
function saveSession(user: User, expiresIn: number = 3600): void {
  const expiryTime = Date.now() + expiresIn * 1000;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Get session from localStorage
 */
function getSession(): User | null {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);

    if (!session || !expiry) return null;

    // Check if session has expired
    if (Date.now() > parseInt(expiry, 10)) {
      clearSession();
      return null;
    }

    return JSON.parse(session);
  } catch (error) {
    console.error('[Auth] Error reading session:', error);
    return null;
  }
}

/**
 * Clear session from localStorage
 */
function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

// =============================================================================
// SIGN UP
// =============================================================================

/**
 * Sign up a new user
 */
export async function signUp(data: SignUpData): Promise<User> {
  try {
    const response = await serverFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Sign up failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.user || !result.session) {
      throw new Error('Invalid response from server');
    }

    const user: User = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.user_metadata?.name || data.name,
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
    };

    // Save session
    saveSession(user, result.session.expires_in);

    // Create user profile
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: new Date().toISOString(),
      preferences: {
        defaultLanguage: 'en',
        autoSave: true,
      },
    };
    await saveUserProfile(profile);

    return user;
  } catch (error) {
    console.error('[Auth] Sign up error:', error);
    throw error;
  }
}

// =============================================================================
// SIGN IN
// =============================================================================

/**
 * Sign in an existing user
 */
export async function signIn(data: SignInData): Promise<User> {
  try {
    const response = await serverFetch('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Sign in failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.user || !result.session) {
      throw new Error('Invalid response from server');
    }

    const user: User = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.user_metadata?.name,
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
    };

    // Save session
    saveSession(user, result.session.expires_in);

    return user;
  } catch (error) {
    console.error('[Auth] Sign in error:', error);
    throw error;
  }
}

// =============================================================================
// SIGN IN WITH OAUTH
// =============================================================================

/**
 * Sign in with OAuth provider (Google, Facebook, etc.)
 */
export async function signInWithOAuth(
  provider: 'google' | 'facebook' | 'github' | 'twitter'
): Promise<void> {
  try {
    const response = await serverFetch('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'OAuth failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.url) {
      throw new Error('OAuth URL not provided');
    }

    // Redirect to OAuth provider
    window.location.href = result.url;
  } catch (error) {
    console.error('[Auth] OAuth error:', error);
    throw error;
  }
}

// =============================================================================
// SIGN OUT
// =============================================================================

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const session = getSession();
    if (!session) return;

    const response = await serverFetch('/auth/signout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn('[Auth] Sign out failed:', response.status);
    }
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
  } finally {
    // Always clear local session
    clearSession();
  }
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Get the current user session
 */
export function getCurrentUser(): User | null {
  return getSession();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<User | null> {
  try {
    const session = getSession();
    if (!session || !session.refreshToken) return null;

    const response = await serverFetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!response.ok) {
      clearSession();
      return null;
    }

    const result = await response.json();

    if (!result.session) {
      clearSession();
      return null;
    }

    const user: User = {
      ...session,
      accessToken: result.session.access_token,
      refreshToken: result.session.refresh_token,
    };

    saveSession(user, result.session.expires_in);
    return user;
  } catch (error) {
    console.error('[Auth] Refresh session error:', error);
    clearSession();
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserMetadata(updates: {
  name?: string;
  [key: string]: any;
}): Promise<User> {
  try {
    const session = getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await serverFetch('/auth/update', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    const user: User = {
      ...session,
      name: result.user?.user_metadata?.name || session.name,
    };

    saveSession(user);
    return user;
  } catch (error) {
    console.error('[Auth] Update user error:', error);
    throw error;
  }
}

// =============================================================================
// PASSWORD RESET
// =============================================================================

/**
 * Request password reset email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const response = await serverFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('[Auth] Password reset error:', error);
    throw error;
  }
}

/**
 * Update password with reset token
 */
export async function updatePassword(
  token: string,
  newPassword: string
): Promise<void> {
  try {
    const response = await serverFetch('/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Update failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('[Auth] Update password error:', error);
    throw error;
  }
}

// =============================================================================
// REACT HOOK (Optional)
// =============================================================================

/**
 * Custom hook for authentication state (for React components)
 * Usage:
 *
 * ```tsx
 * const { user, loading, error, signIn, signOut } = useAuth();
 * ```
 */
export function useAuth() {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: getCurrentUser(),
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    // Check session on mount
    const user = getCurrentUser();
    setAuthState(prev => ({ ...prev, user }));

    // Set up session refresh interval (every 30 minutes)
    const refreshInterval = setInterval(async () => {
      if (isAuthenticated()) {
        await refreshSession();
        setAuthState(prev => ({ ...prev, user: getCurrentUser() }));
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  const handleSignIn = async (data: SignInData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await signIn(data);
      setAuthState({ user, loading: false, error: null });
    } catch (error) {
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      });
      throw error;
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await signUp(data);
      setAuthState({ user, loading: false, error: null });
    } catch (error) {
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
      });
      throw error;
    }
  };

  const handleSignOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    try {
      await signOut();
      setAuthState({ user: null, loading: false, error: null });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed',
      }));
    }
  };

  return {
    ...authState,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    isAuthenticated: !!authState.user,
  };
}

// Note: React import needed for the hook
import React from 'react';
