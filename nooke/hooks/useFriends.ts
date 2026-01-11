import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { Friendship } from '../types';

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
const USE_MOCK_DATA = true;

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
  const { currentUser, friends, setFriends, addFriend, removeFriend } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      loadPendingRequests();
      setupRealtimeSubscription();
    }
  }, [currentUser]);

  const loadFriends = async () => {
    if (!currentUser) return;

    try {
      // Use mocked data if enabled
      if (USE_MOCK_DATA) {
        setFriends(MOCK_FRIENDS);
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
            is_online,
            last_seen_at,
            avatar_url
          )
        `)
        .eq('user_id', currentUser.id)
        .eq('status', 'accepted');

      if (error) throw error;
      setFriends(data || []);
    } catch (error: any) {
      console.error('Error loading friends:', error);
    }
  };

  const loadPendingRequests = async () => {
    if (!currentUser) return;

    try {
      // Use mocked data if enabled
      if (USE_MOCK_DATA) {
        setPendingRequests(MOCK_PENDING_REQUESTS);
        return;
      }

      // Get requests sent TO me
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:user_id (
            id,
            display_name,
            mood,
            is_online,
            avatar_url
          )
        `)
        .eq('friend_id', currentUser.id)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error: any) {
      console.error('Error loading pending requests:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUser) return;

    const channel = supabase
      .channel('friendships-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${currentUser.id},friend_id=eq.${currentUser.id}`,
        },
        () => {
          loadFriends();
          loadPendingRequests();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        () => {
          loadFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendFriendRequest = async (phone: string): Promise<boolean> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    setLoading(true);
    try {
      // Mock mode: just show success
      if (USE_MOCK_DATA) {
        Alert.alert('Success', `Friend request sent (mock mode)`);
        setLoading(false);
        return true;
      }

      // Find user by phone
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .single();

      if (userError || !targetUser) {
        Alert.alert('Not Found', 'No user found with that phone number');
        return false;
      }

      if (targetUser.id === currentUser.id) {
        Alert.alert('Error', 'You cannot add yourself as a friend');
        return false;
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${targetUser.id}),and(user_id.eq.${targetUser.id},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') {
          Alert.alert('Already Friends', 'You are already friends with this user');
        } else {
          Alert.alert('Request Pending', 'Friend request already sent');
        }
        return false;
      }

      // Create friendship request
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUser.id,
          friend_id: targetUser.id,
          status: 'pending',
        });

      if (insertError) throw insertError;

      Alert.alert('Success', `Friend request sent to ${targetUser.display_name}`);
      return true;
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', error.message || 'Failed to send friend request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (friendshipId: string): Promise<boolean> => {
    if (!currentUser) return false;

    setLoading(true);
    try {
      // Mock mode: move from pending to friends list
      if (USE_MOCK_DATA) {
        const request = pendingRequests.find(r => r.id === friendshipId);
        if (request && request.friend) {
          // Remove from pending requests
          setPendingRequests(prev => prev.filter(r => r.id !== friendshipId));

          // Add to friends list
          const newFriend: Friendship = {
            ...request,
            status: 'accepted',
          };
          setFriends([...friends, newFriend]);
        }
        setLoading(false);
        return true;
      }

      // Update the existing request to accepted
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (updateError) throw updateError;

      // Create the reverse friendship (both directions)
      const request = pendingRequests.find(r => r.id === friendshipId);
      if (request) {
        const { error: insertError } = await supabase
          .from('friendships')
          .insert({
            user_id: currentUser.id,
            friend_id: request.user_id,
            status: 'accepted',
          });

        if (insertError) throw insertError;
      }

      await loadFriends();
      await loadPendingRequests();

      return true;
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const declineFriendRequest = async (friendshipId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Mock mode: just remove from pending list
      if (USE_MOCK_DATA) {
        setPendingRequests(prev => prev.filter(r => r.id !== friendshipId));
        setLoading(false);
        return true;
      }

      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      await loadPendingRequests();
      return true;
    } catch (error: any) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
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
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`);

      if (error) throw error;

      removeFriend(friendId);
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
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriendship,
    refreshFriends: loadFriends,
  };
};
