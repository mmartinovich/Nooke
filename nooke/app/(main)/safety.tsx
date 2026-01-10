import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radius, typography, gradients } from '../../lib/theme';
import { useSafety } from '../../hooks/useSafety';
import { useFriends } from '../../hooks/useFriends';

export default function SafetyScreen() {
  const router = useRouter();
  const {
    blocks,
    anchors,
    isInGhostMode,
    isOnBreak,
    enableGhostMode,
    disableGhostMode,
    takeBreak,
    endBreak,
    unblockUser,
    removeAnchor,
  } = useSafety();
  const { friends } = useFriends();

  const [showGhostDuration, setShowGhostDuration] = useState(false);
  const [showBreakDuration, setShowBreakDuration] = useState(false);

  const handleGhostModeToggle = () => {
    if (isInGhostMode) {
      disableGhostMode();
    } else {
      Alert.alert(
        'Ghost Mode Duration',
        'How long would you like to be invisible?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: '30 minutes', onPress: () => enableGhostMode(30) },
          { text: '1 hour', onPress: () => enableGhostMode(60) },
          { text: '4 hours', onPress: () => enableGhostMode(240) },
          { text: '24 hours', onPress: () => enableGhostMode(1440) },
        ]
      );
    }
  };

  const handleBreakToggle = () => {
    if (isOnBreak) {
      endBreak();
    } else {
      Alert.alert(
        'Take a Break Duration',
        'How long do you need?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: '1 hour', onPress: () => takeBreak(1) },
          { text: '6 hours', onPress: () => takeBreak(6) },
          { text: '24 hours', onPress: () => takeBreak(24) },
          { text: '3 days', onPress: () => takeBreak(72) },
          { text: '1 week', onPress: () => takeBreak(168) },
        ]
      );
    }
  };

  const handleUnblock = (userId: string, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Unblock ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unblock', onPress: () => unblockUser(userId) },
      ]
    );
  };

  const handleRemoveAnchor = (userId: string, userName: string) => {
    Alert.alert(
      'Remove Anchor',
      `Remove ${userName} as your anchor?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => removeAnchor(userId), style: 'destructive' },
      ]
    );
  };

  const getBlockedUserName = (blockedId: string) => {
    const friend = friends.find(f => f.friend_id === blockedId);
    return friend?.friend?.display_name || 'Unknown User';
  };

  const getAnchorName = (anchor: any) => {
    return anchor.anchor?.display_name || 'Unknown';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Modes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Modes</Text>

          {/* Ghost Mode */}
          <BlurView intensity={20} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Text style={styles.iconText}>👻</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Ghost Mode</Text>
                  <Text style={styles.cardDescription}>
                    Disappear from everyone temporarily
                  </Text>
                  {isInGhostMode && (
                    <Text style={styles.activeText}>Active</Text>
                  )}
                </View>
                <Switch
                  value={isInGhostMode}
                  onValueChange={handleGhostModeToggle}
                  trackColor={{
                    false: colors.glass.background,
                    true: colors.mood.notGreat.base,
                  }}
                  thumbColor={colors.text.primary}
                />
              </View>
            </View>
          </BlurView>

          {/* Take a Break */}
          <BlurView intensity={20} style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Text style={styles.iconText}>🌙</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>Take a Break</Text>
                  <Text style={styles.cardDescription}>
                    Pause all presence and notifications
                  </Text>
                  {isOnBreak && (
                    <Text style={styles.activeText}>Active</Text>
                  )}
                </View>
                <Switch
                  value={isOnBreak}
                  onValueChange={handleBreakToggle}
                  trackColor={{
                    false: colors.glass.background,
                    true: colors.mood.neutral.base,
                  }}
                  thumbColor={colors.text.primary}
                />
              </View>
            </View>
          </BlurView>
        </View>

        {/* Blocked Users Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Users</Text>
          {blocks.length === 0 ? (
            <BlurView intensity={20} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.emptyText}>No blocked users</Text>
              </View>
            </BlurView>
          ) : (
            blocks.map((block) => (
              <BlurView key={block.id} intensity={20} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>
                        {getBlockedUserName(block.blocked_id)}
                      </Text>
                      <Text style={styles.cardDescription}>
                        {block.block_type === 'mute' && 'Muted'}
                        {block.block_type === 'soft' && 'Soft Blocked'}
                        {block.block_type === 'hard' && 'Hard Blocked'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblock(block.blocked_id, getBlockedUserName(block.blocked_id))}
                      style={styles.unblockButton}
                    >
                      <Text style={styles.unblockText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            ))
          )}
        </View>

        {/* Anchors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Safety Anchors</Text>
            <Text style={styles.sectionSubtitle}>Trusted contacts (max 2)</Text>
          </View>
          {anchors.length === 0 ? (
            <BlurView intensity={20} style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.emptyText}>No anchors set</Text>
                <Text style={styles.emptySubtext}>
                  Anchors get notified when you're inactive for 48+ hours
                </Text>
              </View>
            </BlurView>
          ) : (
            anchors.map((anchor) => (
              <BlurView key={anchor.id} intensity={20} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                      <Text style={styles.iconText}>⚓</Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardTitle}>{getAnchorName(anchor)}</Text>
                      <Text style={styles.cardDescription}>Safety Anchor</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveAnchor(anchor.anchor_id, getAnchorName(anchor))}
                      style={styles.removeButton}
                    >
                      <Feather name="x" size={20} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            ))
          )}
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <BlurView intensity={20} style={styles.infoCard}>
            <View style={styles.cardContent}>
              <Text style={styles.infoTitle}>About Safety Features</Text>
              <Text style={styles.infoText}>
                • All blocks are silent - users won't know{'\n'}
                • Ghost mode makes you invisible to everyone{'\n'}
                • Anchors help watch out for you{'\n'}
                • Visibility settings are per-friend
              </Text>
            </View>
          </BlurView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginBottom: spacing.md,
  },
  cardContent: {
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  cardDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  activeText: {
    fontSize: typography.sizes.xs,
    color: colors.mood.good.base,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs / 2,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  unblockButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.glass.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  unblockText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
  },
  removeButton: {
    padding: spacing.sm,
  },
  infoCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  infoTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 22,
  },
});
