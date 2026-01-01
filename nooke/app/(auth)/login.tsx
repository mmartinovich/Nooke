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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/appStore';
import { colors, gradients, typography, spacing, radius } from '../../lib/theme';

const DEV_MODE = true; // Set to false in production

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setCurrentUser } = useAppStore();

  // Subtle pulse animation for the orb
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSendOTP = async () => {
    if (!phone) {
      Alert.alert('Phone Required', 'Please enter your phone number');
      return;
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      router.push({
        pathname: '/(auth)/verify',
        params: { phone: formattedPhone },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    try {
      // Create or find a test user
      const testUserId = '00000000-0000-0000-0000-000000000001';
      const testPhone = '+1234567890';

      // Check if test user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', testUserId)
        .single();

      let userData;

      if (fetchError || !existingUser) {
        // Create test user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            id: testUserId,
            phone: testPhone,
            display_name: 'Test User',
            mood: 'neutral',
            is_online: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        userData = newUser;
      } else {
        userData = existingUser;
      }

      // Set the user in the store
      setCurrentUser(userData);

      // Navigate to main app
      router.replace('/(main)');

      Alert.alert('Dev Login', 'Logged in as Test User');
    } catch (error: any) {
      console.error('Dev login error:', error);
      Alert.alert('Error', error.message || 'Failed to login');
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
          {/* Decorative orb with glow */}
          <View style={styles.orbContainer}>
            <Animated.View
              style={[
                styles.orbGlow,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <View style={styles.orb} />
          </View>

          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Nooke</Text>
            <Text style={styles.subtitle}>
              Feel connected without{'\n'}the pressure of communicating
            </Text>
          </View>

          {/* Input section */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="+1 234 567 8900"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="phone-pad"
                autoComplete="tel"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                selectionColor={colors.text.accent}
              />
            </View>
            <Text style={styles.hint}>
              We'll send you a verification code
            </Text>
          </View>

          {/* Continue button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSendOTP}
            disabled={loading}
          >
            <LinearGradient
              colors={gradients.button}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Sending...' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Dev Login Button */}
          {DEV_MODE && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDevLogin}
              disabled={loading}
              style={styles.devButton}
            >
              <Text style={styles.devButtonText}>
                🔧 Dev Login (Skip Auth)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Subtle grain texture overlay */}
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
  orbContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  orb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.mood.reachOut.base,
  },
  orbGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.mood.reachOut.glow,
    opacity: 0.6,
  },
  header: {
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size['5xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    backgroundColor: colors.ui.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    overflow: 'hidden',
  },
  input: {
    padding: spacing.lg,
    fontSize: typography.size.xl,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    paddingLeft: spacing.xs,
  },
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    alignItems: 'center',
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
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    opacity: 0.5,
  },
  devButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ui.border,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    alignItems: 'center',
  },
  devButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: '#ffc107',
    letterSpacing: 0.5,
  },
});
