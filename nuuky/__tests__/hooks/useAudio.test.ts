import { renderHook, act } from '@testing-library/react-native';
import { useAudio } from '../../hooks/useAudio';
import { useAppStore } from '../../stores/appStore';

// Mock the LiveKit module
jest.mock('../../lib/livekit', () => ({
  connectToAudioRoom: jest.fn().mockResolvedValue(true),
  disconnectFromAudioRoom: jest.fn().mockResolvedValue(undefined),
  setLocalMicrophoneEnabled: jest.fn().mockResolvedValue(undefined),
  isConnected: jest.fn().mockReturnValue(false),
  isMicrophoneEnabled: jest.fn().mockReturnValue(false),
  setAudioEventCallbacks: jest.fn(),
}));

// Mock permissions
jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('react-native/Libraries/PermissionsAndroid/PermissionsAndroid', () => ({
  PERMISSIONS: {
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
  },
  request: jest.fn().mockResolvedValue('granted'),
}));

describe('useAudio', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset store
    useAppStore.setState({
      audioConnectionStatus: 'disconnected',
      audioError: null,
      speakingParticipants: [],
      currentUser: {
        id: 'user123',
        email: 'test@example.com',
        display_name: 'Test User',
        mood: 'neutral',
      },
      isAuthenticated: true,
    });
  });

  test('initializes with disconnected state', () => {
    const { result } = renderHook(() => useAudio('room123'));

    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isMicrophoneEnabled).toBe(false);
  });

  test('connection status updates from store', () => {
    const { result } = renderHook(() => useAudio('room123'));

    act(() => {
      useAppStore.getState().setAudioConnectionStatus('connecting');
    });

    expect(result.current.connectionStatus).toBe('connecting');
    expect(result.current.isConnecting).toBe(true);
  });

  test('speaking participants update from store', () => {
    const { result } = renderHook(() => useAudio('room123'));

    act(() => {
      useAppStore.getState().addSpeakingParticipant('user456');
    });

    expect(result.current.speakingParticipants).toContain('user456');
  });

  test('isParticipantSpeaking returns correct value', () => {
    const { result } = renderHook(() => useAudio('room123'));

    act(() => {
      useAppStore.getState().addSpeakingParticipant('user456');
    });

    expect(result.current.isParticipantSpeaking('user456')).toBe(true);
    expect(result.current.isParticipantSpeaking('user789')).toBe(false);
  });
});
