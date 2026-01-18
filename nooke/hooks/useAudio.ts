import { useEffect, useCallback, useRef } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';
import { useAppStore } from '../stores/appStore';
import {
  initializeLiveKit,
  setAudioEventCallbacks,
  connectToAudioRoom,
  disconnectFromAudioRoom,
  setLocalMicrophoneEnabled,
  isConnected,
} from '../lib/livekit';
import { AudioConnectionStatus } from '../types';

export const useAudio = (roomId: string | null) => {
  const {
    currentUser,
    audioConnectionStatus,
    setAudioConnectionStatus,
    setAudioError,
    addSpeakingParticipant,
    removeSpeakingParticipant,
    clearSpeakingParticipants,
    speakingParticipants,
  } = useAppStore();

  const isInitialized = useRef(false);
  const currentRoomId = useRef<string | null>(null);

  // Initialize LiveKit on first use
  useEffect(() => {
    if (!isInitialized.current) {
      initializeLiveKit();
      isInitialized.current = true;
    }
  }, []);

  // Set up event callbacks
  useEffect(() => {
    setAudioEventCallbacks({
      onConnectionStatusChange: (status: string) => {
        setAudioConnectionStatus(status as AudioConnectionStatus);
      },
      onParticipantSpeaking: (participantId: string, isSpeaking: boolean) => {
        if (isSpeaking) {
          addSpeakingParticipant(participantId);
        } else {
          removeSpeakingParticipant(participantId);
        }
      },
      onError: (error: string) => {
        setAudioError(error);
        Alert.alert('Audio Error', error);
      },
      onAllMuted: () => {
        // Disconnect after 30 seconds of silence
        console.log('[useAudio] All muted callback - disconnecting');
        handleDisconnect();
      },
    });
  }, []);

  // Clean up on room change or unmount
  useEffect(() => {
    return () => {
      if (currentRoomId.current) {
        console.log('[useAudio] Cleaning up audio for room:', currentRoomId.current);
        disconnectFromAudioRoom();
        currentRoomId.current = null;
        clearSpeakingParticipants();
      }
    };
  }, [roomId]);

  // Request microphone permission
  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS handles permissions via Info.plist and runtime prompts
      // The LiveKit SDK will trigger the permission prompt automatically
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Nooke needs access to your microphone for voice chat',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('[useAudio] Permission error:', err);
        return false;
      }
    }

    return true;
  };

  // Connect to audio when unmuting
  const handleUnmute = useCallback(async (): Promise<boolean> => {
    if (!roomId || !currentUser) {
      console.warn('[useAudio] Cannot unmute: no room or user');
      return false;
    }

    // Request microphone permission first
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in your device settings to use voice chat.'
      );
      return false;
    }

    // If already connected, just enable mic
    if (isConnected()) {
      console.log('[useAudio] Already connected, enabling mic');
      await setLocalMicrophoneEnabled(true);
      return true;
    }

    // Connect to audio room
    console.log('[useAudio] Connecting to audio room:', roomId);
    currentRoomId.current = roomId;
    const success = await connectToAudioRoom(roomId);

    if (!success) {
      currentRoomId.current = null;
      return false;
    }

    return true;
  }, [roomId, currentUser]);

  // Mute (but stay connected for now)
  const handleMute = useCallback(async (): Promise<void> => {
    if (isConnected()) {
      console.log('[useAudio] Muting microphone');
      await setLocalMicrophoneEnabled(false);
    }
  }, []);

  // Disconnect from audio
  const handleDisconnect = useCallback(async (): Promise<void> => {
    console.log('[useAudio] Disconnecting from audio');
    await disconnectFromAudioRoom();
    currentRoomId.current = null;
    clearSpeakingParticipants();
  }, [clearSpeakingParticipants]);

  // Check if a participant is speaking
  const isParticipantSpeaking = useCallback(
    (userId: string): boolean => {
      return speakingParticipants.has(userId);
    },
    [speakingParticipants]
  );

  return {
    connectionStatus: audioConnectionStatus,
    isConnected: audioConnectionStatus === 'connected',
    isConnecting: audioConnectionStatus === 'connecting',
    speakingParticipants,
    isParticipantSpeaking,
    connect: handleUnmute,
    disconnect: handleDisconnect,
    mute: handleMute,
    unmute: handleUnmute,
  };
};
