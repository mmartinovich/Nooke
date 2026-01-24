import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../stores/appStore';
import { supabase } from '../../lib/supabase';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../hooks/useTheme';
import { spacing, radius, typography } from '../../lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { currentUser, logout } = useAppStore();
  const { loading, pickAndUploadAvatar, updateDisplayName, deleteAvatar } = useProfile();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.display_name || '');

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            logout();
            router.replace('/(auth)/login');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to logout');
          }
        },
      },
    ]);
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      const options = currentUser?.avatar_url
        ? ['Take Photo', 'Choose from Library', 'Delete Photo', 'Cancel']
        : ['Take Photo', 'Choose from Library', 'Cancel'];
      const destructiveButtonIndex = currentUser?.avatar_url ? 2 : undefined;
      const cancelButtonIndex = currentUser?.avatar_url ? 3 : 2;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title: 'Profile Picture',
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await pickAndUploadAvatar('camera');
          } else if (buttonIndex === 1) {
            await pickAndUploadAvatar('gallery');
          } else if (buttonIndex === 2 && currentUser?.avatar_url) {
            await deleteAvatar();
          }
        }
      );
    } else {
      // Android fallback - show alert with options
      const buttons = [
        { text: 'Take Photo', onPress: () => pickAndUploadAvatar('camera') },
        { text: 'Choose from Library', onPress: () => pickAndUploadAvatar('gallery') },
      ];
      
      if (currentUser?.avatar_url) {
        buttons.push({
          text: 'Delete Photo',
          onPress: () => deleteAvatar(),
        });
      }
      
      buttons.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' as const });

      Alert.alert('Profile Picture', 'Choose an option', buttons);
    }
  };

  const handleSaveName = async () => {
    const success = await updateDisplayName(editedName);
    if (success) {
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(currentUser?.display_name || '');
    setIsEditingName(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.background as any}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.avatarContainer}>
              {currentUser?.avatar_url ? (
                <Image
                  source={{ uri: currentUser.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={theme.gradients.neonPurple as any}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarInitial}>
                    {currentUser?.display_name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
              )}
              
              {/* Camera overlay */}
              <BlurView
                intensity={80}
                tint={theme.colors.blurTint}
                style={styles.cameraOverlay}
              >
                <Feather name="camera" size={20} color={theme.colors.text.primary} />
              </BlurView>
            </View>
          </TouchableOpacity>
        </View>

        {/* Display Name Section */}
        <BlurView
          intensity={20}
          tint={theme.colors.blurTint}
          style={[styles.card, { borderColor: theme.colors.glass.border }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
              Display Name
            </Text>
            {!isEditingName && (
              <TouchableOpacity
                onPress={() => {
                  setEditedName(currentUser?.display_name || '');
                  setIsEditingName(true);
                }}
              >
                <Feather name="edit-2" size={18} color={theme.colors.text.accent} />
              </TouchableOpacity>
            )}
          </View>

          {isEditingName ? (
            <View>
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
                placeholder="Enter display name"
                placeholderTextColor={theme.colors.text.tertiary}
                maxLength={50}
                autoFocus
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: theme.colors.ui.borderLight },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: theme.colors.text.secondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={loading || editedName.trim().length === 0}
                  style={[styles.button, styles.saveButton]}
                >
                  <LinearGradient
                    colors={theme.gradients.neonCyan as any}
                    style={styles.gradientButton}
                  >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={[styles.value, { color: theme.colors.text.primary }]}>
              {currentUser?.display_name}
            </Text>
          )}
        </BlurView>

        {/* Account Info Section */}
        <BlurView
          intensity={20}
          tint={theme.colors.blurTint}
          style={[styles.card, { borderColor: theme.colors.glass.border }]}
        >
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            Contact
          </Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>
            {currentUser?.phone || currentUser?.email || 'Not set'}
          </Text>
        </BlurView>

        <BlurView
          intensity={20}
          tint={theme.colors.blurTint}
          style={[styles.card, { borderColor: theme.colors.glass.border }]}
        >
          <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
            Account Type
          </Text>
          <Text style={[styles.value, { color: theme.colors.text.primary }]}>
            {currentUser?.auth_provider
              ? currentUser.auth_provider.charAt(0).toUpperCase() +
                currentUser.auth_provider.slice(1)
              : 'Email'}
          </Text>
        </BlurView>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EC4899', '#DB2777'] as any}
            style={styles.logoutGradient}
          >
            <Feather name="log-out" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold as any,
    color: '#fff',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold as any,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.medium as any,
  },
  input: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.medium as any,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  saveButton: {
    // Gradient will fill this
  },
  gradientButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold as any,
  },
  logoutButton: {
    marginTop: spacing.xl,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  logoutGradient: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: {
    marginRight: spacing.sm,
  },
  logoutText: {
    color: '#fff',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as any,
  },
});
