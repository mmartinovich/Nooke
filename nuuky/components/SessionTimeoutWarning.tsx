import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useAppStore } from '../stores/appStore';
import { colors, spacing, typography } from '../lib/theme';

export const SessionTimeoutWarning: React.FC = () => {
  const { sessionWarningShown, setLastActivity, logout } = useAppStore();
  const [countdown, setCountdown] = useState(120); // 2 minutes

  useEffect(() => {
    if (!sessionWarningShown) {
      setCountdown(120);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionWarningShown]);

  const handleContinue = () => {
    setLastActivity();
    setCountdown(120);
  };

  const handleLogout = async () => {
    logout();
  };

  return (
    <Modal
      visible={sessionWarningShown}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Session Timeout Warning</Text>
          <Text style={styles.message}>
            Your session will expire in {countdown} seconds due to inactivity.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={handleContinue}
            >
              <Text style={styles.continueText}>Continue Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.bg.primary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ui.border,
    padding: spacing.xl,
    marginHorizontal: spacing.md,
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontFamily: typography.display,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    fontFamily: typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#34C759',
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: typography.display,
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutText: {
    color: colors.text.primary,
    fontFamily: typography.display,
    fontSize: 16,
  },
});
