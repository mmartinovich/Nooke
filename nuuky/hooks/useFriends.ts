import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { Friendship } from '../types';

// Module-level subscription tracking to prevent duplicates
let activeFriendsSubscription: { cleanup: () => void; userId: string } | null = null;

// Throttle mechanism to prevent excessive API calls on realtime updates
let lastFriendsRefresh = 0;
const FRIENDS_REFRESH_THROTTLE_MS = 3000; // Only refresh every 3 seconds

/**
 * TESTING MODE TOGGLE
 *
 * Set to true to use mocked friend data for testing/development
 * Set to false to use real data from Supabase
 *
 * Mock data includes:
 * - 5 friends with various moods and online statuses
 * - 2 pending friend requests
 */
const USE_MOCK_DATA = false;

// Mock data for testing (matching the friends from index.tsx with avatars)
const MOCK_FRIENDS: Friendship[] = [
  {
    id: 'mock-1',
    user_id: 'current-user',
    friend_id: 'friend-1',
    status: 'accepted',
    visibility: 'full',
    created_at: new Date().toISOString(),
    last_interaction_at: new Date().toISOString(),
    friend: {
      id: 'friend-1',
      phone: '+1234567890',
      display_name: 'Alex',
      mood: 'good',
      is_online: true,
      last_seen_at: new Date().toISOString(),
      avatar_url: 'https://i.pravatar.cc/150?img=1',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'mock-2',
    user_id: 'current-user',
    friend_id: 'friend-2',
    status: 'accepted',
    visibility: 'full',
    created_at: new Date().toISOString(),
    last_interaction_at: new Date().toISOString(),
    friend: {
      id: 'friend-2',
      phone: '+1234567891',
      display_name: 'Sam',
      mood: 'neutral',
      is_online: false,
      last_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      avatar_url: 'https://i.pravatar.cc/150?img=5',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'mock-3',
    user_id: 'current-user',
    friend_id: 'friend-3',
    status: 'accepted',
    visibility: 'full',
    created_at: new Date().toISOString(),
    last_interaction_at: new Date().toISOString(),
    friend: {
      id: 'friend-3',
      phone: '+1234567892',
      display_name: 'Jordan',
      mood: 'not_great',
      is_online: true,
      last_seen_at: new Date().toISOString(),
      avatar_url: 'https://i.pravatar.cc/150?img=12',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'mock-4',
    user_id: 'current-user',
    friend_id: 'friend-4',
    status: 'accepted',
    visibility: 'full',
    created_at: new Date().toISOString(),
    last_interaction_at: new Date().toISOString(),
    friend: {
      id: 'friend-4',
      phone: '+1234567893',
      display_name: 'Taylor',
      mood: 'reach_out',
      is_online: false,
      last_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      avatar_url: 'https://i.pravatar.cc/150?img=47',
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'mock-5',
    user_id: 'current-user',
    friend_id: 'friend-5',
    status: 'accepted',
    visibility: 'full',
    created_at: new Date().toISOString(),
    last_interaction_at: new Date().toISOString(),
    friend: {
      id: 'friend-5',
      phone: '+1234567894',
      display_name: 'Riley',
      mood: 'good',
      is_online: true,
      last_seen_at: new Date().toISOString(),
      avatar_url: 'https://i.pravatar.cc/150?img=33',
      created_at: new Date().toISOString(),
    },
  },
];

const MOCK_PENDING_REQUESTS: Friendship[] = [
  {
    id: 'mock-pending-1',
    user_id: 'friend-6',
    friend_id: 'current-user',
    status: 'pending',
    visibility: 'full',
    created_at: new Date().toISOString(),
    last_interaction_at: new Date().toISOString(),
    friend: {
      id: 'friend-6',
      phone: '+1234567895',
      display_name: 'Riley Davis',
      mood: 'neutral',
      is_online: true,
      last_seen_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'mock-pending-2',
    user_id: 'friend-7',
    friend_id: 'current-user',
    status: 'pending',
    visibility: 'full',
    created_at: new Date().toISOString(),
    last_interaction_at: new Date().toISOString(),
    friend: {
      id: 'friend-7',
      phone: '+1234567896',
      display_name: 'Casey Wilson',
      mood: 'good',
      is_online: false,
      last_seen_at: new Date(Date.now() - 1800000).toISOString(),
      created_at: new Date().toISOString(),
    },
  },
];

export const useFriends = () => {
  const { currentUser, friends, setFriends, removeFriend } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadFriends(true);
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    } else {
      setInitialLoading(false);
      setFriends([]); // Clear friends when no user
    }
  }, [currentUser?.id]); // Use id to avoid re-running on mood change

  const loadFriends = async (isInitial = false) => {
    if (!currentUser) return;

    if (isInitial) {
      setInitialLoading(true);
      // Clear any stale friends data when doing initial load
      setFriends([]);
    }

    try {
      // Use mocked data if enabled
      if (USE_MOCK_DATA) {
        setFriends(MOCK_FRIENDS);
        setHasLoadedOnce(true);
        return;
      }

      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:friend_id (
            id,
            display_name,
            mood,
            custom_mood_id,
            is_online,
            last_seen_at,
            avatar_url,
            custom_mood:custom_mood_id (
              id,
              emoji,
              text,
              color
            )
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'accepted');

      if (error) throw error;

      // Fetch blocks to filter out blocked users
      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', currentUser.id);

      const blockedIds = new Set(blocks?.map(b => b.blocked_id) || []);

      // Filter out blocked friends
      const filteredFriends = data?.filter(f => !blockedIds.has(f.friend_id)) || [];

      setFriends(filteredFriends);
      setHasLoadedOnce(true);
    } catch (error: any) {
      console.error('Error loading friends:', error);
      setFriends([]); // Clear friends on error
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };


  const setupRealtimeSubscription = () => {
    if (!currentUser) return () => {};

    // Prevent duplicate subscriptions - return existing cleanup to properly cleanup on unmount
    if (activeFriendsSubscription && activeFriendsSubscription.userId === currentUser.id) {
      return activeFriendsSubscription.cleanup;
    }

    if (activeFriendsSubscription) {
      activeFriendsSubscription.cleanup();
      activeFriendsSubscription = null;
    }

    // Throttled refresh to prevent excessive API calls
    const throttledLoadFriends = (_payload?: any) => {
      const now = Date.now();
      if (now - lastFriendsRefresh < FRIENDS_REFRESH_THROTTLE_MS) {
        return;
      }
      lastFriendsRefresh = now;
      loadFriends();
    };

    const channel = supabase
      .channel(`friendships-changes-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${currentUser.id}`,
        },
        throttledLoadFriends
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `friend_id=eq.${currentUser.id}`,
        },
        throttledLoadFriends
      )
      .subscribe();

    const cleanup = () => {
      supabase.removeChannel(channel);
      if (activeFriendsSubscription && activeFriendsSubscription.userId === currentUser.id) {
        activeFriendsSubscription = null;
      }
    };

    activeFriendsSubscription = { cleanup, userId: currentUser.id };

    return cleanup;
  };

  const addFriend = async (userId: string): Promise<boolean> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    setLoading(true);
    try {
      // Mock mode: just show success
      if (USE_MOCK_DATA) {
        Alert.alert('Success', 'Friend added (mock mode)');
        setLoading(false);
        return true;
      }

      if (userId === currentUser.id) {
        Alert.alert('Error', 'You cannot add yourself as a friend');
        return false;
      }

      // Check if friendship already exists (either direction)
      const { data: existing, error: checkError } = await supabase
        .from('friendships')
        .select('id, user_id, friend_id, status')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser.id})`);

      if (checkError) {
        console.error('Error checking existing friendship:', checkError);
      }

      if (existing && existing.length > 0) {
        // Check if BOTH directions exist
        const hasForward = existing.some(f => f.user_id === currentUser.id && f.friend_id === userId);
        const hasReverse = existing.some(f => f.user_id === userId && f.friend_id === currentUser.id);

        if (hasForward && hasReverse) {
          await loadFriends();
          return true;
        }

        // Only ONE direction exists - insert the missing direction
        const missingRecords = [];
        if (!hasForward) {
          missingRecords.push({
            user_id: currentUser.id,
            friend_id: userId,
            status: 'accepted',
          });
        }
        if (!hasReverse) {
          missingRecords.push({
            user_id: userId,
            friend_id: currentUser.id,
            status: 'accepted',
          });
        }

        const { error: insertMissingError } = await supabase
          .from('friendships')
          .insert(missingRecords)
          .select();

        if (insertMissingError) {
          console.error('Error inserting missing direction:', insertMissingError);
          if (insertMissingError.code !== '23505') {
            throw insertMissingError;
          }
        }

        await loadFriends();
        return true;
      }

      // Get user details for confirmation message
      const { data: targetUser } = await supabase
        .from('users')
        .select('display_name')
        .eq('id', userId)
        .single();

      // Create instant two-way friendship (no pending state)
      const { error: insertError } = await supabase
        .from('friendships')
        .insert([
          {
            user_id: currentUser.id,
            friend_id: userId,
            status: 'accepted',
          },
          {
            user_id: userId,
            friend_id: currentUser.id,
            status: 'accepted',
          },
        ])
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        // Handle duplicate key error - means they're already friends
        if (insertError.code === '23505') {
          await loadFriends();
          return true; // Silently succeed since they're already friends
        }
        throw insertError;
      }

      await loadFriends();

      Alert.alert('Success', `${targetUser?.display_name || 'Friend'} added!`);
      return true;
    } catch (error: any) {
      console.error('Error adding friend:', error);

      // Don't show error for duplicate - just refresh
      if (error.code === '23505') {
        await loadFriends();
        return true;
      }

      Alert.alert('Error', error.message || 'Failed to add friend');
      return false;
    } finally {
      setLoading(false);
    }
  };


  const removeFriendship = async (friendId: string): Promise<boolean> => {
    if (!currentUser) return false;

    setLoading(true);
    try {
      // Mock mode: remove from friends list
      if (USE_MOCK_DATA) {
        setFriends(friends.filter(f => f.friend_id !== friendId));
        setLoading(false);
        return true;
      }

      // Delete both directions of the friendship
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`)
        .select();

      if (error) throw error;

      // Immediately update local state to prevent the realtime subscription from showing stale data
      setFriends(friends.filter(f => f.friend_id !== friendId));

      return true;
    } catch (error: any) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    friends,
    loading,
    initialLoading,
    hasLoadedOnce,
    addFriend,
    removeFriendship,
    refreshFriends: loadFriends,
  };
};
