import React from 'react';
import { render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { FriendParticle } from '../../components/FriendParticle';

// Mock dependencies
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('../../lib/theme', () => ({
  getMoodColor: jest.fn(() => ({
    base: '#3FCBFF',
    soft: 'rgba(63, 203, 255, 0.15)',
    glow: 'rgba(63, 203, 255, 0.4)',
  })),
}));

describe('FriendParticle', () => {
  const mockFriend = {
    id: 'friend123',
    user_id: 'user123',
    friend_id: 'friend123',
    status: 'accepted' as const,
    friend: {
      id: 'friend123',
      display_name: 'Test Friend',
      avatar_url: 'https://example.com/avatar.png',
      mood: 'good' as const,
      is_online: true,
    },
  };

  const mockOrbitAngle = new Animated.Value(0);

  test('renders friend particle', () => {
    const { getByTestId } = render(
      <FriendParticle
        friend={mockFriend}
        baseAngle={0}
        orbitRadius={100}
        orbitAngle={mockOrbitAngle}
        isOrbiting={true}
        isSpeaking={false}
        onPress={jest.fn()}
      />
    );

    // Component should render without crashing
    expect(getByTestId).toBeDefined();
  });

  test('does not crash when friend data is missing', () => {
    const incompleteFriend = {
      id: 'friend123',
      user_id: 'user123',
      friend_id: 'friend123',
      status: 'accepted' as const,
    };

    expect(() => {
      render(
        <FriendParticle
          friend={incompleteFriend as any}
          baseAngle={0}
          orbitRadius={100}
          orbitAngle={mockOrbitAngle}
          isOrbiting={true}
          isSpeaking={false}
          onPress={jest.fn()}
        />
      );
    }).not.toThrow();
  });
});
