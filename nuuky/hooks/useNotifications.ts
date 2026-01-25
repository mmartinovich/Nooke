import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { AppNotification } from '../types';

// Module-level subscription tracking to prevent duplicates
let activeNotificationsSubscription: { cleanup: () => void; userId: string } | null = null;

export const useNotifications = () => {
  const router = useRouter();
  const {
    currentUser,
    notifications,
    unreadNotificationCount,
    setNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    removeNotification,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [currentUser?.id]);

  // Load notifications from Supabase
  const loadNotifications = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh notifications (for pull-to-refresh)
  const refreshNotifications = async () => {
    if (!currentUser) return;

    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error: any) {
      console.error('Error refreshing notifications:', error);
      Alert.alert('Error', 'Failed to refresh notifications. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    if (!currentUser) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update local state
      markNotificationRead(notificationId);
      return true;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false);

      if (error) throw error;

      // Update local state
      markAllNotificationsRead();
      return true;
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    if (!currentUser) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update local state
      removeNotification(notificationId);
      return true;
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  // Handle notification tap - navigate based on type
  const handleNotificationTap = useCallback(async (notification: AppNotification) => {
    // Mark as read first
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'nudge':
      case 'flare':
        // Navigate to home (Quantum Orbit) - friend context is in the data
        router.push('/(main)');
        break;
      case 'friend_request':
      case 'friend_accepted':
        router.push('/(main)/friends');
        break;
      case 'room_invite':
        router.push('/(main)/rooms');
        break;
      default:
        router.push('/(main)');
    }
  }, [router]);

  // Setup realtime subscription for new notifications
  const setupRealtimeSubscription = () => {
    if (!currentUser) return () => {};

    // Prevent duplicate subscriptions
    if (activeNotificationsSubscription && activeNotificationsSubscription.userId === currentUser.id) {
      return activeNotificationsSubscription.cleanup;
    }

    if (activeNotificationsSubscription) {
      activeNotificationsSubscription.cleanup();
      activeNotificationsSubscription = null;
    }

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          // Add new notification to the top of the list
          addNotification(payload.new as AppNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          removeNotification(payload.old.id);
        }
      )
      .subscribe();

    const cleanup = () => {
      supabase.removeChannel(notificationsChannel);
      activeNotificationsSubscription = null;
    };

    activeNotificationsSubscription = { cleanup, userId: currentUser.id };

    return cleanup;
  };

  return {
    notifications,
    unreadCount: unreadNotificationCount,
    loading,
    refreshing,
    loadNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNotificationTap,
  };
};
