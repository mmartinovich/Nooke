import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';
import { Room, RoomParticipant } from '../types';

export const useRoom = () => {
  const { currentUser, currentRoom, setCurrentRoom, setActiveRooms } = useAppStore();
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [activeRooms, setActiveRoomsList] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadActiveRooms();
      setupRealtimeSubscription();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentRoom) {
      loadParticipants();
    }
  }, [currentRoom]);

  const loadActiveRooms = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          participants:room_participants (
            id,
            user_id,
            is_muted,
            joined_at,
            user:user_id (
              id,
              display_name,
              avatar_url,
              mood
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rooms = data || [];
      setActiveRoomsList(rooms);
      setActiveRooms(rooms);
    } catch (error: any) {
      console.error('Error loading active rooms:', error);
    }
  };

  const loadParticipants = async () => {
    if (!currentRoom) return;

    try {
      const { data, error } = await supabase
        .from('room_participants')
        .select(`
          *,
          user:user_id (
            id,
            display_name,
            avatar_url,
            mood,
            is_online
          )
        `)
        .eq('room_id', currentRoom.id);

      if (error) throw error;
      setParticipants(data || []);
    } catch (error: any) {
      console.error('Error loading participants:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUser) return;

    // Subscribe to room changes
    const roomsChannel = supabase
      .channel('rooms-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        () => {
          loadActiveRooms();
        }
      )
      .subscribe();

    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
        },
        () => {
          if (currentRoom) {
            loadParticipants();
          }
          loadActiveRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(participantsChannel);
    };
  };

  const createRoom = async (name?: string, isPrivate: boolean = false): Promise<Room | null> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return null;
    }

    setLoading(true);
    try {
      // Create the room - RLS policy will verify auth.uid() matches creator_id
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          creator_id: currentUser.id,
          name: name || `${currentUser.display_name}'s Room`,
          is_private: isPrivate,
          is_active: true,
          audio_active: false, // Presence-only for now
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Auto-join the creator
      const { error: joinError } = await supabase
        .from('room_participants')
        .insert({
          room_id: room.id,
          user_id: currentUser.id,
          is_muted: true, // Start muted
        });

      if (joinError) throw joinError;

      setCurrentRoom(room);
      await loadActiveRooms();

      return room;
    } catch (error: any) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string): Promise<boolean> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    setLoading(true);
    try {
      // Check if already in the room
      const { data: existing } = await supabase
        .from('room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (existing) {
        // Already in room, just load it
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (room) {
          setCurrentRoom(room);
          return true;
        }
      }

      // Join the room - RLS policy will verify auth.uid() matches user_id
      const { error: joinError } = await supabase
        .from('room_participants')
        .insert({
          room_id: roomId,
          user_id: currentUser.id,
          is_muted: true,
        });

      if (joinError) throw joinError;

      // Load the room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;

      setCurrentRoom(room);
      await loadActiveRooms();

      return true;
    } catch (error: any) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join room');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async (): Promise<void> => {
    if (!currentUser || !currentRoom) return;

    setLoading(true);
    try {
      // Remove participant - RLS policy will verify auth.uid() matches user_id
      const { error: deleteError } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', currentRoom.id)
        .eq('user_id', currentUser.id);

      if (deleteError) throw deleteError;

      // Check if room is empty
      const { data: remaining } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', currentRoom.id);

      // If empty and user was creator, close the room
      if ((!remaining || remaining.length === 0) && currentRoom.creator_id === currentUser.id) {
        await supabase
          .from('rooms')
          .update({ is_active: false, closed_at: new Date().toISOString() })
          .eq('id', currentRoom.id);
      }

      setCurrentRoom(null);
      setParticipants([]);
      await loadActiveRooms();
    } catch (error: any) {
      console.error('Error leaving room:', error);
      Alert.alert('Error', 'Failed to leave room');
    } finally {
      setLoading(false);
    }
  };

  const toggleMute = async (): Promise<void> => {
    if (!currentUser || !currentRoom) return;

    try {
      // Get current mute state
      const { data: participant } = await supabase
        .from('room_participants')
        .select('is_muted')
        .eq('room_id', currentRoom.id)
        .eq('user_id', currentUser.id)
        .single();

      if (!participant) return;

      // Toggle mute - RLS policy will verify auth.uid() matches user_id
      const { error } = await supabase
        .from('room_participants')
        .update({ is_muted: !participant.is_muted })
        .eq('room_id', currentRoom.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      await loadParticipants();
    } catch (error: any) {
      console.error('Error toggling mute:', error);
    }
  };

  return {
    currentRoom,
    participants,
    activeRooms,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleMute,
    loadActiveRooms,
  };
};
