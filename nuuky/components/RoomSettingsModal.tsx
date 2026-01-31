import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { getMoodColor, interactionStates } from "../lib/theme";
import { useTheme } from "../hooks/useTheme";
import { useInviteLink } from "../hooks/useInviteLink";
import { RoomParticipant } from "../types";
import { isUserTrulyOnline } from "../lib/utils";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface RoomSettingsModalProps {
  visible: boolean;
  roomName: string;
  roomId: string;
  isCreator: boolean;
  creatorId: string;
  participants: RoomParticipant[];
  currentUserId: string;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onLeave: () => void;
  onInviteFriends: () => void;
  onRemoveParticipant?: (userId: string, userName: string) => Promise<void>;
}

const MAX_VISIBLE_AVATARS = 4;

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  visible,
  roomName,
  roomId,
  isCreator,
  creatorId,
  participants,
  currentUserId,
  onClose,
  onRename,
  onDelete,
  onLeave,
  onInviteFriends,
  onRemoveParticipant,
}) => {
  const { theme, accent } = useTheme();
  const { createInviteLink, shareInviteLink, loading: linkLoading } = useInviteLink();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(roomName);
  const [loading, setLoading] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [sharingLink, setSharingLink] = useState(false);
  const [membersExpanded, setMembersExpanded] = useState(false);

  const handleRename = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Please enter a room name");
      return;
    }

    if (newName === roomName) {
      setIsRenaming(false);
      return;
    }

    try {
      setLoading(true);
      await onRename(newName.trim());
      setIsRenaming(false);
    } catch (error) {
      Alert.alert("Error", "Failed to rename room");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Room", "Are you sure you want to delete this room? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await onDelete();
            onClose();
          } catch (error) {
            Alert.alert("Error", "Failed to delete room");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleRemoveParticipant = (userId: string, userName: string) => {
    Alert.alert("Remove Member", `Remove ${userName} from this room?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            setRemovingUserId(userId);
            await onRemoveParticipant?.(userId, userName);
          } catch (error) {
            Alert.alert("Error", "Failed to remove member");
          } finally {
            setRemovingUserId(null);
          }
        },
      },
    ]);
  };

  const toggleMembersExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMembersExpanded(!membersExpanded);
  };

  // Sort participants: creator first, then alphabetical
  const sortedParticipants = useMemo(() => {
    if (!participants || participants.length === 0) return [];
    return [...participants].sort((a, b) => {
      // Creator always first
      if (a.user_id === creatorId) return -1;
      if (b.user_id === creatorId) return 1;
      // Then alphabetical
      const nameA = a.user?.display_name || "";
      const nameB = b.user?.display_name || "";
      return nameA.localeCompare(nameB);
    });
  }, [participants, creatorId]);

  const handleShareLink = async () => {
    setSharingLink(true);
    try {
      // Create a new invite link
      const link = await createInviteLink(roomId, { expiresInHours: 24 * 7 }); // 7 days
      if (link) {
        await shareInviteLink(link.token, roomName);
      }
    } catch (error) {
      console.error("Error sharing link:", error);
      Alert.alert("Error", "Failed to create share link");
    } finally {
      setSharingLink(false);
    }
  };

  const handleClose = () => {
    setIsRenaming(false);
    setNewName(roomName);
    setMembersExpanded(false);
    onClose();
  };

  // Render avatar for the stack
  const renderStackedAvatar = (participant: RoomParticipant, index: number) => {
    const user = participant.user;
    if (!user) return null;

    const moodColors = getMoodColor(user.mood || "neutral");
    const isOnline = isUserTrulyOnline(user.is_online, user.last_seen_at);

    return (
      <View
        key={participant.id}
        style={[
          styles.stackedAvatarWrapper,
          index === 0 && styles.firstStackedAvatar,
        ]}
      >
        {user.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={[
              styles.stackedAvatar,
              {
                borderColor: isOnline ? moodColors.base : theme.colors.glass.border,
                backgroundColor: theme.colors.bg.secondary,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.stackedAvatar,
              styles.stackedAvatarPlaceholder,
              {
                backgroundColor: accent.soft,
                borderColor: isOnline ? moodColors.base : theme.colors.glass.border,
              },
            ]}
          >
            <Ionicons name="person" size={16} color={accent.primary} />
          </View>
        )}
        {isOnline && <View style={[styles.stackedOnlineIndicator, { backgroundColor: theme.colors.status.success, borderColor: theme.colors.bg.secondary }]} />}
      </View>
    );
  };

  // Render expanded member row
  const renderExpandedMember = (participant: RoomParticipant, index: number) => {
    const user = participant.user;
    if (!user) return null;

    const isCurrentUser = user.id === currentUserId;
    const isRoomCreator = user.id === creatorId;
    const canRemove = isCreator && !isCurrentUser && onRemoveParticipant;
    const isRemoving = removingUserId === user.id;
    const moodColors = getMoodColor(user.mood || "neutral");
    const isOnline = isUserTrulyOnline(user.is_online, user.last_seen_at);

    return (
      <React.Fragment key={participant.id}>
        {index > 0 && <View style={[styles.memberRowSeparator, { backgroundColor: theme.colors.glass.border }]} />}
        <View style={styles.expandedMemberRow}>
          <View style={styles.memberInfo}>
            {/* Avatar with mood border */}
            <View style={styles.memberAvatarWrapper}>
              {user.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={[
                    styles.memberAvatar,
                    {
                      borderColor: isOnline ? moodColors.base : theme.colors.glass.border,
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.memberAvatar,
                    styles.memberAvatarPlaceholder,
                    {
                      backgroundColor: accent.soft,
                      borderColor: isOnline ? moodColors.base : theme.colors.glass.border,
                    },
                  ]}
                >
                  <Ionicons name="person" size={18} color={accent.primary} />
                </View>
              )}
              {isOnline && <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.status.success, borderColor: theme.colors.bg.primary }]} />}
            </View>

            {/* Name and status */}
            <View style={styles.memberText}>
              <View style={styles.nameRow}>
                <Text style={[styles.memberName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                  {user.display_name}
                  {isCurrentUser ? " (You)" : ""}
                </Text>
                {isRoomCreator && (
                  <View style={[styles.ownerBadge, { backgroundColor: accent.soft }]}>
                    <Ionicons name="star" size={10} color={accent.primary} />
                  </View>
                )}
              </View>
              <Text style={[styles.memberStatus, { color: theme.colors.text.tertiary }]}>{isOnline ? "Online" : "Offline"}</Text>
            </View>
          </View>

          {/* Remove button */}
          {canRemove && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveParticipant(user.id, user.display_name)}
              disabled={isRemoving}
              activeOpacity={0.7}
            >
              {isRemoving ? (
                <ActivityIndicator size="small" color={theme.colors.status.error} />
              ) : (
                <Ionicons name="close-circle" size={20} color={theme.colors.status.error} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </React.Fragment>
    );
  };

  const visibleAvatars = sortedParticipants.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = sortedParticipants.length - MAX_VISIBLE_AVATARS;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.glass.overlay }]}>
        <View style={styles.modalContainer}>
          <LinearGradient colors={theme.gradients.background} style={styles.gradientBackground}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.glass.background, borderBottomColor: theme.colors.glass.border }]}>
              <View style={styles.headerLeft} />
              <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Room Settings</Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: theme.colors.glass.background }]}
                onPress={handleClose}
                activeOpacity={interactionStates.pressed}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Room Name Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitleText, { color: theme.colors.text.tertiary }]}>ROOM NAME</Text>
                {isRenaming ? (
                  <View style={styles.renameContainer}>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.glass.border, color: theme.colors.text.primary }]}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder="Enter room name"
                      placeholderTextColor={theme.colors.text.tertiary}
                      autoFocus
                      maxLength={50}
                    />
                    <View style={styles.renameButtons}>
                      <TouchableOpacity
                        style={[styles.cancelButton, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.glass.border }]}
                        onPress={() => {
                          setIsRenaming(false);
                          setNewName(roomName);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.cancelButtonText, { color: theme.colors.text.secondary }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: accent.primary }]}
                        onPress={handleRename}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.saveButtonText, { color: theme.colors.text.primary }]}>{loading ? "Saving..." : "Save"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.groupedCard, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.glass.border }]}>
                    <TouchableOpacity
                      style={styles.groupedCardRow}
                      onPress={() => isCreator && setIsRenaming(true)}
                      disabled={!isCreator}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.secondary} />
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, { color: theme.colors.text.primary }]}>{roomName}</Text>
                        {isCreator && <Text style={[styles.actionSubtitle, { color: theme.colors.text.tertiary }]}>Tap to rename</Text>}
                      </View>
                      {isCreator && <Ionicons name="pencil" size={16} color={theme.colors.text.tertiary} />}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Members Section - Compact Avatar Stack */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitleTextInline, { color: theme.colors.text.tertiary }]}>MEMBERS</Text>
                  <View style={[styles.badge, { backgroundColor: theme.colors.glass.background }]}>
                    <Text style={[styles.badgeText, { color: theme.colors.text.secondary }]}>{participants?.length || 0}</Text>
                  </View>
                </View>

                <View style={[styles.groupedCard, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.glass.border }]}>
                  {/* Avatar Stack Header */}
                  <TouchableOpacity
                    style={styles.avatarStackContainer}
                    onPress={toggleMembersExpanded}
                    activeOpacity={0.7}
                  >
                    <View style={styles.avatarStack}>
                      {visibleAvatars.map((participant, index) => 
                        renderStackedAvatar(participant, index)
                      )}
                      {overflowCount > 0 && (
                        <View style={[styles.stackedAvatarWrapper, styles.overflowBadge, { backgroundColor: theme.colors.glass.border, borderColor: theme.colors.bg.secondary }]}>
                          <Text style={[styles.overflowText, { color: theme.colors.text.secondary }]}>+{overflowCount}</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={membersExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.colors.text.tertiary}
                    />
                  </TouchableOpacity>

                  {/* Expanded Member List */}
                  {membersExpanded && (
                    <View style={styles.expandedMembersList}>
                      <View style={[styles.fullWidthSeparator, { backgroundColor: theme.colors.glass.border }]} />
                      {sortedParticipants.map((participant, index) =>
                        renderExpandedMember(participant, index)
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* Actions Section - Grouped Card */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitleText, { color: theme.colors.text.tertiary }]}>ACTIONS</Text>
                {/* Invite & Share Actions (Creator Only) */}
                {isCreator && (
                  <View style={[styles.groupedCard, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.glass.border }]}>
                    {/* Invite Friends */}
                    <TouchableOpacity
                      style={styles.groupedCardRow}
                      onPress={onInviteFriends}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionIconContainer, { backgroundColor: accent.soft }]}>
                        <Ionicons name="person-add-outline" size={18} color={accent.primary} />
                      </View>
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, { color: theme.colors.text.primary }]}>Invite Friends</Text>
                        <Text style={[styles.actionSubtitle, { color: theme.colors.text.tertiary }]}>Add people to this room</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>

                    {/* Share Link */}
                    <View style={[styles.internalSeparator, { backgroundColor: theme.colors.glass.border }]} />
                    <TouchableOpacity
                      style={styles.groupedCardRow}
                      onPress={handleShareLink}
                      disabled={sharingLink}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionIconContainer, { backgroundColor: accent.soft }]}>
                        {sharingLink ? (
                          <ActivityIndicator size="small" color={accent.primary} />
                        ) : (
                          <Ionicons name="link-outline" size={18} color={accent.primary} />
                        )}
                      </View>
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, { color: theme.colors.text.primary }]}>Share Link</Text>
                        <Text style={[styles.actionSubtitle, { color: theme.colors.text.tertiary }]}>Anyone with link can join</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Leave Room - Separate Card */}
                <View style={[styles.groupedCard, styles.leaveCard, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.glass.border }]}>
                  <TouchableOpacity
                    style={styles.groupedCardRow}
                    onPress={() => {
                      onLeave();
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIconContainer, styles.leaveIconContainer, { backgroundColor: `${theme.colors.status.error}20` }]}>
                      <Ionicons name="exit-outline" size={18} color={theme.colors.status.error} />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionTitle, styles.leaveText, { color: theme.colors.status.error }]}>Leave Room</Text>
                      <Text style={[styles.actionSubtitle, { color: theme.colors.text.tertiary }]}>Exit this room</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Danger Zone (Creator Only) */}
              {isCreator && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitleText, styles.dangerSectionTitle, { color: theme.colors.status.error }]}>DANGER ZONE</Text>
                  <View style={[styles.groupedCard, styles.dangerCard, { backgroundColor: theme.colors.glass.background, borderColor: `${theme.colors.status.error}33` }]}>
                    <TouchableOpacity
                      style={styles.groupedCardRow}
                      onPress={handleDelete}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.actionIconContainer, styles.dangerIconContainer, { backgroundColor: `${theme.colors.status.error}20` }]}>

                        <Ionicons name="trash-outline" size={18} color={theme.colors.status.error} />
                      </View>
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, styles.dangerText, { color: theme.colors.status.error }]}>Delete Room</Text>
                        <Text style={[styles.actionSubtitle, { color: theme.colors.text.tertiary }]}>Permanently remove this room</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 24,
    overflow: "hidden",
  },
  gradientBackground: {
    borderRadius: 24,
    overflow: "hidden",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    width: 44,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  // Section header with badge
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  sectionTitleTextInline: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  // Grouped card styles
  groupedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  groupedCardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  internalSeparator: {
    height: 1,
    marginLeft: 56,
  },
  // Action styles
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 1,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  // Leave/Danger styles
  leaveCard: {
    marginTop: 12,
  },
  leaveIconContainer: {
  },
  leaveText: {
  },
  dangerSectionTitle: {
  },
  dangerCard: {
  },
  dangerIconContainer: {
  },
  dangerText: {
  },
  // Rename container
  renameContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  renameButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Avatar Stack styles
  avatarStackContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackedAvatarWrapper: {
    marginLeft: -10,
    position: "relative",
  },
  firstStackedAvatar: {
    marginLeft: 0,
  },
  stackedAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
  },
  stackedAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  stackedOnlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  overflowBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  overflowText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Expanded member list
  expandedMembersList: {
    overflow: "hidden",
  },
  fullWidthSeparator: {
    height: 1,
  },
  expandedMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  memberRowSeparator: {
    height: 1,
    marginLeft: 60,
  },
  memberInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  memberAvatarWrapper: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  memberAvatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  memberText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 1,
  },
  ownerBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  memberStatus: {
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
  },
});
