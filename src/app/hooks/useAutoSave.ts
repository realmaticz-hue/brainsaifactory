// =============================================================================
// AUTO-SAVE HOOK — Automatic Saving with Debounce
// =============================================================================

import { useEffect, useRef, useCallback } from 'react';

export interface AutoSaveOptions {
  delay?: number; // milliseconds, default 30000 (30 seconds)
  enabled?: boolean; // default true
  onSave?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

/**
 * Auto-save hook with debounce
 * Automatically saves data after user stops editing
 */
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => void | Promise<void>,
  options: AutoSaveOptions = {}
) {
  const {
    delay = 30000, // 30 seconds default
    enabled = true,
    onSave,
    onError,
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);
  const lastSaveTimeRef = useRef<number>(Date.now());

  const save = useCallback(async () => {
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      await saveFunction(data);
      lastSaveTimeRef.current = Date.now();
      previousDataRef.current = data;
      onSave?.();
    } catch (error) {
      console.error('[AutoSave] Save failed:', error);
      onError?.(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      isSavingRef.current = false;
    }
  }, [data, saveFunction, onSave, onError]);

  useEffect(() => {
    if (!enabled) return;

    // Check if data actually changed
    const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
    if (!dataChanged) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      const dataChanged = JSON.stringify(data) !== JSON.stringify(previousDataRef.current);
      if (enabled && dataChanged && !isSavingRef.current) {
        // Fire and forget - component is unmounting
        saveFunction(data).catch(err => {
          console.error('[AutoSave] Unmount save failed:', err);
        });
      }
    };
  }, []);

  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return save();
  }, [save]);

  const getTimeSinceLastSave = useCallback(() => {
    return Date.now() - lastSaveTimeRef.current;
  }, []);

  return {
    saveNow,
    getTimeSinceLastSave,
    isSaving: isSavingRef.current,
  };
}
