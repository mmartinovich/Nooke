import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  ScrollView,
  ActionSheetIOS,
  Platform,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "../../stores/appStore";
import { useProfile } from "../../hooks/useProfile";
import { useTheme } from "../../hooks/useTheme";
import { spacing, radius, typography } from "../../lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { currentUser } = useAppStore();
  const { loading, pickAndUploadAvatar, updateDisplayName, deleteAvatar } = useProfile();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.display_name || "");

  // Sync editedName when currentUser changes
  useEffect(() => {
    if (!isEditingName && currentUser?.display_name) {
      setEditedName(currentUser.display_name);
    }
  }, [currentUser?.display_name, isEditingName]);

  const handleAvatarPress = () => {
    if (Platform.OS === "ios") {
      const options = currentUser?.avatar_url
        ? ["Take Photo", "Choose from Library", "Remove Photo", "Cancel"]
        : ["Take Photo", "Choose from Library", "Cancel"];
      const destructiveButtonIndex = currentUser?.avatar_url ? 2 : undefined;
      const cancelButtonIndex = currentUser?.avatar_url ? 3 : 2;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title: "Change Profile Photo",
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await pickAndUploadAvatar("camera");
          } else if (buttonIndex === 1) {
            await pickAndUploadAvatar("gallery");
          } else if (buttonIndex === 2 && currentUser?.avatar_url) {
            await deleteAvatar();
          }
        },
      );
    } else {
      // Android fallback
      const buttons: any[] = [
        { text: "Take Photo", onPress: () => pickAndUploadAvatar("camera") },
        { text: "Choose from Library", onPress: () => pickAndUploadAvatar("gallery") },
      ];

      if (currentUser?.avatar_url) {
        buttons.push({
          text: "Remove Photo",
          style: "destructive",
          onPress: () => deleteAvatar(),
        });
      }

      buttons.push({ text: "Cancel", style: "cancel" });
      Alert.alert("Change Profile Photo", "", buttons);
    }
  };

  const handleSaveName = async () => {
    if (editedName.trim().length === 0) {
      Alert.alert("Invalid Name", "Display name cannot be empty");
      return;
    }
    const success = await updateDisplayName(editedName.trim());
    if (success) {
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(currentUser?.display_name || "");
    setIsEditingName(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg.primary }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient colors={theme.gradients.background as unknown as string[]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + spacing.md, borderBottomColor: theme.colors.glass.border }]}
      >
        <TouchableOpacity
          style={[styles.backButton, { borderColor: theme.colors.glass.border }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Profile</Text>

        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            disabled={loading}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <View style={[styles.avatarContainer, { borderColor: theme.colors.glass.border }]}>
              {currentUser?.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} style={styles.avatar} />
              ) : (
                <LinearGradient colors={theme.gradients.neonPurple as any} style={styles.avatar}>
                  <Text style={styles.avatarInitial}>{currentUser?.display_name?.[0]?.toUpperCase() || "?"}</Text>
                </LinearGradient>
              )}

              {/* Camera badge */}
              <View style={[styles.cameraBadge, { backgroundColor: theme.colors.mood.neutral.base }]}>
                <Feather name="camera" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <Text style={[styles.tapToChange, { color: theme.colors.text.tertiary }]}>Tap to change photo</Text>
        </View>

        {/* Display Name Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Display Name</Text>

        <BlurView
          intensity={isDark ? 20 : 10}
          tint={theme.colors.blurTint}
          style={[styles.card, { borderColor: theme.colors.glass.border }]}
        >
          <View style={styles.cardContent}>
            {isEditingName ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: theme.colors.text.primary,
                      borderColor: theme.colors.ui.border,
                      backgroundColor: theme.colors.glass.background,
                    },
                  ]}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.colors.text.tertiary}
                  maxLength={50}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    style={[styles.actionButton, { borderColor: theme.colors.glass.border }]}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.colors.text.secondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveName}
                    disabled={loading || editedName.trim().length === 0}
                    style={[styles.actionButton, styles.saveButton]}
                  >
                    <LinearGradient colors={theme.gradients.neonCyan as any} style={styles.saveButtonGradient}>
                      <Text style={styles.saveButtonText}>{loading ? "Saving..." : "Save"}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.displayRow}>
                <View style={styles.nameInfo}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>✏️</Text>
                  </View>
                  <Text style={[styles.nameText, { color: theme.colors.text.primary }]}>
                    {currentUser?.display_name || "Set your name"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setEditedName(currentUser?.display_name || "");
                    setIsEditingName(true);
                  }}
                  style={[styles.editButton, { backgroundColor: theme.colors.glass.background }]}
                >
                  <Feather name="edit-2" size={16} color={theme.colors.text.accent} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </BlurView>

        {/* Account Info Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Account Info</Text>

        <BlurView
          intensity={isDark ? 20 : 10}
          tint={theme.colors.blurTint}
          style={[styles.card, { borderColor: theme.colors.glass.border }]}
        >
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>📧</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                  {currentUser?.email || "Not set"}
                </Text>
              </View>
            </View>
          </View>
        </BlurView>

        <BlurView
          intensity={isDark ? 20 : 10}
          tint={theme.colors.blurTint}
          style={[styles.card, { borderColor: theme.colors.glass.border }]}
        >
          <View style={styles.cardContent}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔐</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Sign-in Method</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                  {currentUser?.auth_provider
                    ? currentUser.auth_provider.charAt(0).toUpperCase() + currentUser.auth_provider.slice(1)
                    : "Email"}
                </Text>
              </View>
            </View>
          </View>
        </BlurView>

        {currentUser?.phone && (
          <BlurView
            intensity={isDark ? 20 : 10}
            tint={theme.colors.blurTint}
            style={[styles.card, { borderColor: theme.colors.glass.border }]}
          >
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📱</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.text.tertiary }]}>Phone</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{currentUser.phone}</Text>
                </View>
              </View>
            </View>
          </BlurView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.bold as any,
    letterSpacing: -0.5,
  },
  placeholderButton: {
    width: 44,
    height: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  // Avatar Section
  avatarSection: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontSize: typography.sizes["4xl"],
    fontWeight: typography.weights.bold as any,
    color: "#fff",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#050510",
  },
  tapToChange: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },
  // Section Titles
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  // Cards
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  cardContent: {
    padding: spacing.md,
  },
  // Display Name Row
  displayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  nameText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    flex: 1,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  // Edit Container
  editContainer: {
    gap: spacing.md,
  },
  input: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium as any,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
  },
  saveButton: {
    borderWidth: 0,
    overflow: "hidden",
  },
  saveButtonGradient: {
    flex: 1,
    width: "100%",
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: "#fff",
  },
  // Info Rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium as any,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
  },
});
