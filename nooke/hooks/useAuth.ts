import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { User } from '../types';
import { registerForPushNotificationsAsync, savePushTokenToUser } from '../lib/notifications';

export const useAuth = () => {
  const { currentUser, isAuthenticated, setCurrentUser, logout } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          logout();
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentUser(data as User);
        // Update online status
        await updateOnlineStatus(true);
        // Register for push notifications
        await registerPushNotifications(userId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('users')
        .update({
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const registerPushNotifications = async (userId: string) => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await savePushTokenToUser(userId, token);
      }
    } catch (error) {
      console.error('Error registering push notifications:', error);
    }
  };

  const signOut = async () => {
    try {
      // Update online status before signing out
      await updateOnlineStatus(false);
      await supabase.auth.signOut();
      logout();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user: currentUser,
    isAuthenticated,
    loading,
    signOut,
    updateOnlineStatus,
  };
};
