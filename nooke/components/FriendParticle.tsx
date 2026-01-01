import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Animated, Easing, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { User } from '../types';
import { getMoodColor } from '../lib/theme';

const { width, height } = Dimensions.get('window');
const CENTER_X = width / 2;
const CENTER_Y = height / 2;
const PARTICLE_SIZE = 60;

interface FriendParticleProps {
  friend: User;
  index: number;
  total: number;
  onPress: () => void;
  hasActiveFlare: boolean;
  position: { x: number; y: number };
}

export function FriendParticle({
  friend,
  index,
  total,
  onPress,
  hasActiveFlare,
  position,
}: FriendParticleProps) {
  const orbitAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const flareAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Calculate orbital parameters from initial position
  const centerX = CENTER_X;
  const centerY = CENTER_Y;
  const initialX = position.x;
  const initialY = position.y;
  const deltaX = initialX - centerX;
  const deltaY = initialY - centerY;
  const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const initialAngle = Math.atan2(deltaY, deltaX);

  // Subtle orbital rotation animation - slow and smooth
  useEffect(() => {
    // Extremely slow rotation around center (one full rotation every 180-240 seconds, varies by index)
    // Each friend rotates at slightly different speeds for organic feel
    const rotationDuration = 180000 + index * 10000; // 180-240 seconds (3-4 minutes) depending on index
    
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: rotationDuration,
        easing: Easing.linear,
        useNativeDriver: false, // Need to use false for translateX/Y with calculated values
      })
    ).start();
  }, [index]);

  // Gentle floating animation - no orbital motion
  // Note: Using useNativeDriver: false to match orbital animation (can't mix native/JS drivers)
  useEffect(() => {
    // Gentle floating bob
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 2000 + index * 150,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: false, // Must match orbital animation driver type
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 2000 + index * 150,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: false, // Must match orbital animation driver type
        }),
      ])
    ).start();

    // More noticeable pulse for online friends
    if (friend.is_online) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false, // Must match orbital animation driver type
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false, // Must match orbital animation driver type
          }),
        ])
      ).start();
    }
  }, [friend.is_online]);

  useEffect(() => {
    if (hasActiveFlare) {
      Animated.loop(
        Animated.timing(flareAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // Must match orbital animation driver type
        })
      ).start();
    } else {
      flareAnim.setValue(0);
    }
  }, [hasActiveFlare]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const moodColors = getMoodColor(friend.mood || 'neutral');
  
  // Get initials from display name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Gentle floating animation
  const bounceTranslate = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  // Orbital rotation - subtle circular motion around center
  // Pre-calculate positions for 8 key points around the circle for smooth interpolation
  const orbitPoints = 8;
  const orbitXValues: number[] = [];
  const orbitYValues: number[] = [];
  const inputRangeValues: number[] = [];
  
  for (let i = 0; i <= orbitPoints; i++) {
    const angle = initialAngle + (i / orbitPoints) * 2 * Math.PI;
    orbitXValues.push(Math.cos(angle) * radius);
    orbitYValues.push(Math.sin(angle) * radius);
    inputRangeValues.push(i / orbitPoints);
  }

  const orbitX = orbitAnim.interpolate({
    inputRange: inputRangeValues,
    outputRange: orbitXValues,
    extrapolate: 'clamp',
  });

  const orbitY = orbitAnim.interpolate({
    inputRange: inputRangeValues,
    outputRange: orbitYValues,
    extrapolate: 'clamp',
  });

  // More prominent glow for online friends
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.5],
  });

  const flareScale = flareAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.8],
  });

  const flareOpacity = flareAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.9],
  });

  const trailOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: centerX - PARTICLE_SIZE / 2,
          top: centerY - PARTICLE_SIZE / 2,
          transform: [
            { translateX: orbitX },
            { translateY: Animated.add(orbitY, bounceTranslate) },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Emergency Flare Alert */}
      {hasActiveFlare && (
        <Animated.View
          style={[
            styles.flareGlow,
            {
              transform: [{ scale: flareScale }],
              opacity: flareOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['rgba(244, 112, 182, 0.5)', 'rgba(236, 72, 153, 0.3)', 'transparent']}
            style={styles.flareCircle}
          />
        </Animated.View>
      )}

      {/* Main Particle with Avatar */}
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={{ zIndex: 100 }}>
        <View style={styles.particleWrapper}>
          {/* Prominent outer glow for all friends - brighter for online (behind everything) */}
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: friend.is_online ? glowOpacity : 0.12,
                zIndex: -1,
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[`${moodColors.glow}`, `${moodColors.base}35`, 'transparent']}
              style={styles.glowCircle}
            />
          </Animated.View>

          {/* Mood-colored ring - always visible, brighter for online friends */}
          <View 
            style={[
              styles.moodRing, 
              { 
                borderColor: friend.is_online ? moodColors.base : moodColors.base,
                borderWidth: friend.is_online ? 4 : 3,
                opacity: friend.is_online ? 1 : 0.7,
                shadowColor: moodColors.base,
                shadowOpacity: friend.is_online ? 0.6 : 0.3,
                shadowRadius: friend.is_online ? 8 : 6,
                shadowOffset: { width: 0, height: 0 },
                elevation: friend.is_online ? 8 : 5,
                zIndex: 1,
              }
            ]} 
          />
          
          {/* Avatar circle - on top */}
          <View style={styles.avatarContainer}>
            {friend.avatar_url ? (
              <Image
                source={{ uri: friend.avatar_url }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: `${moodColors.base}30` }]}>
                <Text style={styles.initialsText}>{getInitials(friend.display_name)}</Text>
              </View>
            )}
          </View>

          {/* Online indicator - positioned outside avatar circle at top-right */}
          {friend.is_online && (
            <Animated.View 
              style={[
                styles.onlineIndicator,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                  transform: [{
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  }],
                },
              ]} 
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Name label */}
      <Text style={styles.nameLabel} numberOfLines={1}>
        {friend.display_name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: PARTICLE_SIZE * 2.2,
    height: PARTICLE_SIZE * 2.2,
    top: -PARTICLE_SIZE * 0.6,
    left: -PARTICLE_SIZE * 0.6,
    zIndex: -1,
  },
  glowCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  particleWrapper: {
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 10,
  },
  moodRing: {
    position: 'absolute',
    width: PARTICLE_SIZE + 8,
    height: PARTICLE_SIZE + 8,
    borderRadius: 9999,
    borderWidth: 3,
    elevation: 5,
  },
  avatarContainer: {
    width: PARTICLE_SIZE,
    height: PARTICLE_SIZE,
    borderRadius: PARTICLE_SIZE / 2,
    overflow: 'hidden',
    elevation: 20,
    zIndex: 100,
    position: 'relative',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    zIndex: 101,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  onlineIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#34D399',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  nameLabel: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 80,
    letterSpacing: 0.1,
  },
  flareGlow: {
    position: 'absolute',
    width: PARTICLE_SIZE * 3,
    height: PARTICLE_SIZE * 3,
  },
  flareCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
});
