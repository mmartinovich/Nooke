import { renderHook, act } from '@testing-library/react-native';
import { useAppStore } from '../../stores/appStore';

describe('appStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAppStore.setState({
      currentUser: null,
      isAuthenticated: false,
      friends: [],
      activeRooms: [],
      myRooms: [],
      currentRoom: null,
      isInRoom: false,
      roomParticipants: [],
      roomInvites: [],
      defaultRoomId: null,
      homeRoomId: null,
      themeMode: 'dark',
      lowPowerMode: false,
      isOnline: true,
      audioConnectionStatus: 'disconnected',
      audioError: null,
      speakingParticipants: [],
      customMoods: [],
      activeCustomMood: null,
      notifications: [],
      unreadNotificationCount: 0,
    });
  });

  test('setCurrentUser updates user and auth state', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      display_name: 'Test User',
      mood: 'good' as const,
    };

    act(() => {
      useAppStore.getState().setCurrentUser(mockUser);
    });

    const state = useAppStore.getState();
    expect(state.currentUser).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  test('logout clears all user data', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      display_name: 'Test User',
      mood: 'good' as const,
    };

    act(() => {
      useAppStore.getState().setCurrentUser(mockUser);
      useAppStore.getState().setFriends([{ id: '1', user_id: '123', friend_id: '456', status: 'accepted' }]);
      useAppStore.getState().logout();
    });

    const state = useAppStore.getState();
    expect(state.currentUser).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.friends).toEqual([]);
    expect(state.activeRooms).toEqual([]);
    expect(state.notifications).toEqual([]);
    // Theme should be preserved
    expect(state.themeMode).toBe('dark');
  });

  test('addFriend adds friend to list', () => {
    const mockFriend = {
      id: '1',
      user_id: '123',
      friend_id: '456',
      status: 'accepted' as const,
    };

    act(() => {
      useAppStore.getState().addFriend(mockFriend);
    });

    const state = useAppStore.getState();
    expect(state.friends).toHaveLength(1);
    expect(state.friends[0]).toEqual(mockFriend);
  });

  test('removeFriend removes friend from list', () => {
    const mockFriend = {
      id: '1',
      user_id: '123',
      friend_id: '456',
      status: 'accepted' as const,
    };

    act(() => {
      useAppStore.getState().addFriend(mockFriend);
      useAppStore.getState().removeFriend('1');
    });

    const state = useAppStore.getState();
    expect(state.friends).toHaveLength(0);
  });

  test('setIsOnline updates network state', () => {
    act(() => {
      useAppStore.getState().setIsOnline(false);
    });

    expect(useAppStore.getState().isOnline).toBe(false);

    act(() => {
      useAppStore.getState().setIsOnline(true);
    });

    expect(useAppStore.getState().isOnline).toBe(true);
  });

  test('addSpeakingParticipant adds participant', () => {
    act(() => {
      useAppStore.getState().addSpeakingParticipant('user123');
    });

    expect(useAppStore.getState().speakingParticipants).toContain('user123');
  });

  test('addSpeakingParticipant does not duplicate', () => {
    act(() => {
      useAppStore.getState().addSpeakingParticipant('user123');
      useAppStore.getState().addSpeakingParticipant('user123');
    });

    expect(useAppStore.getState().speakingParticipants).toHaveLength(1);
  });

  test('removeSpeakingParticipant removes participant', () => {
    act(() => {
      useAppStore.getState().addSpeakingParticipant('user123');
      useAppStore.getState().removeSpeakingParticipant('user123');
    });

    expect(useAppStore.getState().speakingParticipants).not.toContain('user123');
  });
});
