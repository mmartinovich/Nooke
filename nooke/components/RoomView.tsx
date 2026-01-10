import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius, typography } from '../lib/theme';
import { RoomParticipant } from '../types';

interface RoomViewProps {
  roomName?: string;
  participants: RoomParticipant[];
  isCreator: boolean;
  onLeave: () => void;
}

export const RoomView: React.FC<RoomViewProps> = ({
  roomName,
  participants,
  isCreator,
  onLeave,
}) => {
  return (
    <View style={styles.container}>
      {/* Room Header */}
      <BlurView intensity={30} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerInfo}>
            <Text style={styles.roomName}>{roomName || 'Room'}</Text>
            <Text style={styles.participantCount}>
              {participants.length} {participants.length === 1 ? 'person' : 'people'} here
            </Text>
          </View>

          {/* Audio Coming Soon Badge */}
          <View style={styles.badge}>
            <LinearGradient
              colors={['rgba(236, 72, 153, 0.3)', 'rgba(168, 85, 247, 0.3)']}
              style={styles.badgeGradient}
            >
              <Text style={styles.badgeText}>Audio Soon</Text>
            </LinearGradient>
          </View>
        </View>
      </BlurView>

      {/* Participants List */}
      <ScrollView
        style={styles.participantsList}
        contentContainerStyle={styles.participantsContent}
        showsVerticalScrollIndicator={false}
      >
        {participants.map((participant) => (
          <ParticipantCard key={participant.id} participant={participant} />
        ))}
      </ScrollView>

      {/* Leave Button */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={onLeave} style={styles.leaveButton}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.3)', 'rgba(220, 38, 38, 0.3)']}
            style={styles.leaveGradient}
          >
            <Text style={styles.leaveText}>Leave Room</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ParticipantCard: React.FC<{ participant: RoomParticipant }> = ({ participant }) => {
  const user = participant.user;
  if (!user) return null;

  return (
    <BlurView intensity={20} style={styles.participantCard}>
      <View style={styles.participantContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {user.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          {/* Online indicator */}
          {user.is_online && (
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.display_name}</Text>
          <View style={styles.statusRow}>
            {participant.is_muted && (
              <View style={styles.mutedBadge}>
                <Text style={styles.mutedText}>Muted</Text>
              </View>
            )}
          </View>
        </View>

        {/* Mood indicator */}
        <View style={[styles.moodDot, { backgroundColor: getMoodColor(user.mood) }]} />
      </View>
    </BlurView>
  );
};

const getMoodColor = (mood: string): string => {
  switch (mood) {
    case 'good':
      return colors.mood.good.base;
    case 'neutral':
      return colors.mood.neutral.base;
    case 'not_great':
      return colors.mood.notGreat.base;
    case 'reach_out':
      return colors.mood.reachOut.base;
    default:
      return colors.mood.neutral.base;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    margin: spacing.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  headerContent: {
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  participantCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  badge: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  participantsList: {
    flex: 1,
  },
  participantsContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  participantCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginBottom: spacing.sm,
  },
  participantContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: colors.glass.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.bg.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.mood.good.base,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutedBadge: {
    backgroundColor: colors.glass.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  mutedText: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontWeight: typography.weights.medium,
  },
  moodDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  leaveButton: {
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  leaveGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  leaveText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
});
