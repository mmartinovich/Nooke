import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOnline } from '../stores/appStore';
import { typography } from '../lib/theme';
import { useTheme } from '../hooks/useTheme';

export const OfflineBanner = () => {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 4, backgroundColor: theme.colors.status.error }]}>
      <Text style={[styles.text, { color: theme.colors.text.primary }]}>No internet connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 6,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    fontFamily: typography.display,
    fontSize: typography.size.sm,
  },
});
