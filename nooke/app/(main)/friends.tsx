import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFriends } from '../../hooks/useFriends';
import { colors, gradients, typography, spacing, radius, getMoodColor } from '../../lib/theme';
import { User } from '../../types';

export default function FriendsScreen() {
  const {
    friends,
    pendingRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriendship,
    refreshFriends,
  } = useFriends();

  const [phone, setPhone] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleAddFriend = async () => {
    if (!phone) {
      Alert.alert('Phone Required', 'Please enter a phone number');
      return;
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    const success = await sendFriendRequest(formattedPhone);

    if (success) {
      setPhone('');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFriends();
    setRefreshing(false);
  };

  const handleRemoveFriend = (friend: User) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.display_name} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFriendship(friend.id),
        },
      ]
    );
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.gradient}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text.secondary}
          />
        }
      >
        {/* Add Friend Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Friend</Text>

          <LinearGradient colors={gradients.card} style={styles.card}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="+1 234 567 8900"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAddFriend}
              disabled={loading}
            >
              <LinearGradient
                colors={gradients.button}
                style={[styles.button, loading && styles.buttonDisabled]}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Sending...' : 'Send Request'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Pending Requests ({pendingRequests.length})
            </Text>

            {pendingRequests.map((request) => {
              const friend = request.friend as User;
              const moodColors = getMoodColor(friend.mood);

              return (
                <LinearGradient
                  key={request.id}
                  colors={gradients.card}
                  style={styles.requestCard}
                >
                  <View style={styles.requestInfo}>
                    {/* Friend orb */}
                    <View style={styles.miniOrbWrapper}>
                      <View
                        style={[
                          styles.miniGlow,
                          { backgroundColor: moodColors.glow },
                        ]}
                      />
                      <View
                        style={[
                          styles.miniOrb,
                          { backgroundColor: moodColors.base },
                        ]}
                      />
                    </View>

                    <View style={styles.requestText}>
                      <Text style={styles.requestName}>{friend.display_name}</Text>
                      <Text style={styles.requestPhone}>{friend.phone}</Text>
                    </View>
                  </View>

                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      onPress={() => acceptFriendRequest(request.id)}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={gradients.button}
                        style={styles.acceptButton}
                      >
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => declineFriendRequest(request.id)}
                      disabled={loading}
                      style={styles.declineButton}
                    >
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              );
            })}
          </View>
        )}

        {/* Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Friends ({friends.length})
          </Text>

          {friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>
                Add friends using their phone number
              </Text>
            </View>
          ) : (
            friends.map((friendship) => {
              const friend = friendship.friend as User;
              const moodColors = getMoodColor(friend.mood);

              return (
                <LinearGradient
                  key={friendship.id}
                  colors={gradients.card}
                  style={styles.friendCard}
                >
                  <View style={styles.friendInfo}>
                    {/* Friend orb */}
                    <View style={styles.miniOrbWrapper}>
                      <View
                        style={[
                          styles.miniGlow,
                          { backgroundColor: moodColors.glow },
                        ]}
                      />
                      <View
                        style={[
                          styles.miniOrb,
                          { backgroundColor: moodColors.base },
                          !friend.is_online && styles.offline,
                        ]}
                      />
                      {friend.is_online && (
                        <View style={styles.onlineIndicator} />
                      )}
                    </View>

                    <View style={styles.friendText}>
                      <Text style={styles.friendName}>
                        {friend.display_name}
                      </Text>
                      <Text style={styles.friendStatus}>
                        {friend.is_online ? 'Online' : 'Offline'} · {friend.mood}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveFriend(friend)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.removeButton}>×</Text>
                  </TouchableOpacity>
                </LinearGradient>
              );
            })
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    backgroundColor: colors.ui.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: spacing.md,
  },
  input: {
    padding: spacing.md,
    fontSize: typography.size.base,
    color: colors.text.primary,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  requestCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: spacing.sm,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  requestText: {
    flex: 1,
  },
  requestName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  requestPhone: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
  },
  acceptButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
  },
  declineButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  declineButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.tertiary,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.ui.border,
    marginBottom: spacing.sm,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniOrbWrapper: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  miniGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.4,
  },
  miniOrb: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  offline: {
    opacity: 0.5,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.mood.good.base,
    borderWidth: 2,
    borderColor: colors.bg.primary,
  },
  friendText: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs / 2,
  },
  friendStatus: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  removeButton: {
    fontSize: 32,
    color: colors.text.tertiary,
    fontWeight: '300',
    lineHeight: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
});
