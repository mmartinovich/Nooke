import { create } from 'zustand';
import { User, Friendship, Room } from '../types';

interface AppState {
  // Auth state
  currentUser: User | null;
  isAuthenticated: boolean;

  // Friends state
  friends: Friendship[];

  // Rooms state
  activeRooms: Room[];
  currentRoom: Room | null;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setFriends: (friends: Friendship[]) => void;
  addFriend: (friend: Friendship) => void;
  removeFriend: (friendId: string) => void;
  setActiveRooms: (rooms: Room[]) => void;
  setCurrentRoom: (room: Room | null) => void;
  updateUserMood: (mood: User['mood']) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentUser: null,
  isAuthenticated: false,
  friends: [],
  activeRooms: [],
  currentRoom: null,

  // Actions
  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),

  setFriends: (friends) => set({ friends }),

  addFriend: (friend) => set((state) => ({
    friends: [...state.friends, friend]
  })),

  removeFriend: (friendId) => set((state) => ({
    friends: state.friends.filter(f => f.id !== friendId)
  })),

  setActiveRooms: (rooms) => set({ activeRooms: rooms }),

  setCurrentRoom: (room) => set({ currentRoom: room }),

  updateUserMood: (mood) => set((state) => ({
    currentUser: state.currentUser
      ? { ...state.currentUser, mood }
      : null
  })),

  logout: () => set({
    currentUser: null,
    isAuthenticated: false,
    friends: [],
    activeRooms: [],
    currentRoom: null
  })
}));
