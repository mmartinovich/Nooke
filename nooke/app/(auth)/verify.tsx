import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';
import { colors, gradients, typography, spacing, radius } from '../../lib/theme';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const setCurrentUser = useAppStore((state) => state.setCurrentUser);

  const handleVerifyOTP = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: code,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user) {
        // Fetch user profile from public.users table
        let { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // If user profile doesn't exist, create it (fallback if trigger didn't work)
        if (userError && userError.code === 'PGRST116') {
          const phoneNumber = data.user.phone || phone || 'unknown';
          const { data: newUserData, error: createError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              phone: phoneNumber,
              display_name: 'User',
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating user profile:', createError);
          } else {
            userData = newUserData;
          }
        } else if (userError) {
          console.error('Error fetching user profile:', userError);
        }

        if (userData) {
          setCurrentUser(userData);
        }

        // Navigate to main app
        router.replace('/(main)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) throw error;

      Alert.alert('Success', 'A new code has been sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Verification</Text>
            <Text style={styles.subtitle}>
              Enter the code we sent to{'\n'}{phone}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                editable={!loading}
                autoFocus
                selectionColor={colors.text.accent}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            <LinearGradient
              colors={gradients.button}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Verifying...' : 'Verify'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleResendCode}
              disabled={loading}
            >
              <Text style={styles.actionText}>Resend code</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text style={styles.actionText}>Change number</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grain} pointerEvents="none" />
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputWrapper: {
    backgroundColor: colors.ui.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    overflow: 'hidden',
  },
  input: {
    padding: spacing.xl,
    fontSize: typography.size['3xl'],
    textAlign: 'center',
    letterSpacing: 12,
    color: colors.text.primary,
    fontWeight: typography.weight.bold,
  },
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: colors.ui.border,
  },
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    opacity: 0.5,
  },
});
