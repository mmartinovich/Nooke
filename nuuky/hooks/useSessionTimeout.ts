import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '../stores/appStore';

export const useSessionTimeout = () => {
  const {
    currentUser,
    isAuthenticated,
    lastActivityTimestamp,
    sessionTimeoutMinutes,
    setLastActivity,
    logout,
  } = useAppStore();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isMountedRef = useRef(true);

  const handleUserActivity = () => {
    if (!currentUser || !isAuthenticated) return;

    // Reset the timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLastActivity();

    // Restart timer
    startSessionTimer();
  };

  const startSessionTimer = () => {
    const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

    // Auto-logout timeout
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && currentUser) {
        logout();
      }
    }, timeoutMs);
  };

  useEffect(() => {
    if (!currentUser || !isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    isMountedRef.current = true;
    startSessionTimer();

    // Handle app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (!isMountedRef.current) return;

      const wasInBackground = appStateRef.current.match(/inactive|background/);
      const isNowActive = nextAppState === 'active';

      if (wasInBackground && isNowActive) {
        // App came to foreground - check if session expired
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityTimestamp;
        const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

        if (timeSinceLastActivity > timeoutMs) {
          // Session expired while in background
          logout();
        } else {
          // Reset timer on foreground
          handleUserActivity();
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      subscription.remove();
    };
  }, [currentUser?.id, isAuthenticated, sessionTimeoutMinutes]);

  return { handleUserActivity };
};
