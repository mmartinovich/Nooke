import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '../stores/appStore';

const WARNING_BEFORE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes warning

export const useSessionTimeout = () => {
  const {
    currentUser,
    isAuthenticated,
    lastActivityTimestamp,
    sessionTimeoutMinutes,
    setLastActivity,
    showSessionWarning,
    logout,
  } = useAppStore();

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isMountedRef = useRef(true);

  const handleUserActivity = () => {
    if (!currentUser || !isAuthenticated) return;

    // Reset the timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    showSessionWarning(false);
    setLastActivity();

    // Restart timers
    startSessionTimers();
  };

  const startSessionTimers = () => {
    const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

    // Warning timeout (triggers 2 minutes before expiry)
    warningTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        showSessionWarning(true);
      }
    }, timeoutMs - WARNING_BEFORE_TIMEOUT_MS);

    // Actual timeout
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && currentUser) {
        logout();
      }
    }, timeoutMs);
  };

  useEffect(() => {
    if (!currentUser || !isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      return;
    }

    isMountedRef.current = true;
    startSessionTimers();

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
          // Reset timers on foreground
          handleUserActivity();
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      subscription.remove();
    };
  }, [currentUser?.id, isAuthenticated, sessionTimeoutMinutes]);

  return { handleUserActivity };
};
