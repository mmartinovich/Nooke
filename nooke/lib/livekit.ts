import {
  Room,
  RoomEvent,
  RemoteParticipant,
  Track,
  ConnectionState,
  LocalParticipant,
  Participant,
} from 'livekit-client';
import { registerGlobals } from '@livekit/react-native-webrtc';
import { AudioSession } from '@livekit/react-native';
import { supabase } from './supabase';
import Constants from 'expo-constants';
import { LiveKitTokenResponse } from '../types';

// Initialize LiveKit WebRTC globals - call this once at app startup
let globalsRegistered = false;
export const initializeLiveKit = () => {
  if (!globalsRegistered) {
    registerGlobals();
    globalsRegistered = true;
    console.log('[LiveKit] WebRTC globals registered');
  }
};

// Singleton room instance
let currentRoom: Room | null = null;
let silenceTimer: ReturnType<typeof setTimeout> | null = null;
const SILENCE_TIMEOUT_MS = 30000; // 30 seconds

// Event callbacks
type AudioEventCallbacks = {
  onConnectionStatusChange: (status: string) => void;
  onParticipantSpeaking: (participantId: string, isSpeaking: boolean) => void;
  onError: (error: string) => void;
  onAllMuted: () => void;
};

let eventCallbacks: AudioEventCallbacks | null = null;

export const setAudioEventCallbacks = (callbacks: AudioEventCallbacks) => {
  eventCallbacks = callbacks;
};

// Get LiveKit URL from config
const getLiveKitUrl = (): string => {
  return Constants.expoConfig?.extra?.livekitUrl || '';
};

// Request token from Edge Function
export const requestLiveKitToken = async (
  roomId: string
): Promise<LiveKitTokenResponse | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No active session');
    }

    console.log('[LiveKit] Requesting token for room:', roomId);

    const { data, error } = await supabase.functions.invoke('livekit-token', {
      body: { roomId },
    });

    if (error) {
      console.error('[LiveKit] Token request error:', error);
      throw error;
    }

    console.log('[LiveKit] Token received successfully');
    return data;
  } catch (error) {
    console.error('[LiveKit] Failed to get token:', error);
    eventCallbacks?.onError('Failed to get audio token');
    return null;
  }
};

// Connect to LiveKit room
export const connectToAudioRoom = async (roomId: string): Promise<boolean> => {
  try {
    // Start audio session (required for iOS)
    await AudioSession.startAudioSession();
    console.log('[LiveKit] Audio session started');

    eventCallbacks?.onConnectionStatusChange('connecting');

    // Get token
    const tokenData = await requestLiveKitToken(roomId);
    if (!tokenData) {
      eventCallbacks?.onConnectionStatusChange('error');
      return false;
    }

    // Create room instance
    currentRoom = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Set up event listeners
    setupRoomEventListeners(currentRoom);

    // Connect
    console.log('[LiveKit] Connecting to room:', tokenData.roomName);
    await currentRoom.connect(tokenData.serverUrl, tokenData.token);

    console.log('[LiveKit] Connected successfully');
    eventCallbacks?.onConnectionStatusChange('connected');

    // Enable microphone (unmuted state)
    await currentRoom.localParticipant.setMicrophoneEnabled(true);
    console.log('[LiveKit] Microphone enabled');

    // Start silence timer
    resetSilenceTimer();

    return true;
  } catch (error) {
    console.error('[LiveKit] Failed to connect:', error);
    eventCallbacks?.onConnectionStatusChange('error');
    eventCallbacks?.onError('Failed to connect to audio');
    return false;
  }
};

// Disconnect from LiveKit room
export const disconnectFromAudioRoom = async (): Promise<void> => {
  console.log('[LiveKit] Disconnecting from audio room');
  clearSilenceTimer();

  if (currentRoom) {
    await currentRoom.disconnect();
    currentRoom = null;
  }

  await AudioSession.stopAudioSession();
  eventCallbacks?.onConnectionStatusChange('disconnected');
  console.log('[LiveKit] Disconnected');
};

// Toggle local microphone
export const setLocalMicrophoneEnabled = async (
  enabled: boolean
): Promise<void> => {
  if (!currentRoom?.localParticipant) {
    console.warn('[LiveKit] No local participant to toggle mic');
    return;
  }

  console.log('[LiveKit] Setting microphone enabled:', enabled);
  await currentRoom.localParticipant.setMicrophoneEnabled(enabled);

  if (enabled) {
    // Reset silence timer when unmuting
    resetSilenceTimer();
  } else {
    // Check if everyone is now muted
    checkAllMuted();
  }
};

// Check if anyone is unmuted
export const isAnyoneUnmuted = (): boolean => {
  if (!currentRoom) return false;

  // Check local participant
  if (currentRoom.localParticipant.isMicrophoneEnabled) {
    return true;
  }

  // Check remote participants
  for (const participant of currentRoom.remoteParticipants.values()) {
    if (participant.isMicrophoneEnabled) {
      return true;
    }
  }

  return false;
};

// Set up room event listeners
const setupRoomEventListeners = (room: Room) => {
  room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
    console.log('[LiveKit] Connection state changed:', state);
    const statusMap: Record<ConnectionState, string> = {
      [ConnectionState.Disconnected]: 'disconnected',
      [ConnectionState.Connecting]: 'connecting',
      [ConnectionState.Connected]: 'connected',
      [ConnectionState.Reconnecting]: 'reconnecting',
      [ConnectionState.SignalReconnecting]: 'reconnecting',
    };
    eventCallbacks?.onConnectionStatusChange(
      statusMap[state] || 'disconnected'
    );
  });

  room.on(
    RoomEvent.ActiveSpeakersChanged,
    (speakers: Participant[]) => {
      // Notify about all current speakers
      const speakerIds = new Set(speakers.map((s) => s.identity));

      // Update speaking state for all remote participants
      room.remoteParticipants.forEach((participant) => {
        eventCallbacks?.onParticipantSpeaking(
          participant.identity,
          speakerIds.has(participant.identity)
        );
      });

      // Check local participant speaking
      if (room.localParticipant) {
        const localSpeaking = speakerIds.has(room.localParticipant.identity);
        eventCallbacks?.onParticipantSpeaking(
          room.localParticipant.identity,
          localSpeaking
        );
      }

      // Reset silence timer if anyone is speaking
      if (speakers.length > 0) {
        resetSilenceTimer();
      }
    }
  );

  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    console.log('[LiveKit] Participant connected:', participant.identity);
  });

  room.on(
    RoomEvent.ParticipantDisconnected,
    (participant: RemoteParticipant) => {
      console.log('[LiveKit] Participant disconnected:', participant.identity);
      eventCallbacks?.onParticipantSpeaking(participant.identity, false);
    }
  );

  room.on(RoomEvent.TrackMuted, (publication, participant) => {
    if (publication.kind === Track.Kind.Audio) {
      console.log('[LiveKit] Track muted:', participant.identity);
      checkAllMuted();
    }
  });

  room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
    if (publication.kind === Track.Kind.Audio) {
      console.log('[LiveKit] Track unmuted:', participant.identity);
      resetSilenceTimer();
    }
  });

  room.on(RoomEvent.Disconnected, () => {
    console.log('[LiveKit] Room disconnected');
    eventCallbacks?.onConnectionStatusChange('disconnected');
  });
};

// Silence timer management
const resetSilenceTimer = () => {
  clearSilenceTimer();

  silenceTimer = setTimeout(() => {
    console.log('[LiveKit] Silence timer expired, checking if all muted');
    if (!isAnyoneUnmuted()) {
      console.log('[LiveKit] All muted for 30s, triggering disconnect');
      eventCallbacks?.onAllMuted();
    }
  }, SILENCE_TIMEOUT_MS);
};

const clearSilenceTimer = () => {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
};

const checkAllMuted = () => {
  if (!isAnyoneUnmuted()) {
    console.log('[LiveKit] All participants muted, starting silence timer');
    resetSilenceTimer();
  }
};

// Get current room (for debugging/status)
export const getCurrentRoom = (): Room | null => currentRoom;

// Check if connected
export const isConnected = (): boolean => {
  return currentRoom?.state === ConnectionState.Connected;
};
