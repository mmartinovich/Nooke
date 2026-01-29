import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsOnline } from '../stores/appStore';
import { typography } from '../lib/theme';

export const OfflineBanner = () => {
  const isOnline = useIsOnline();
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 4 }]}>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EF4444',
    paddingBottom: 6,
    alignItems: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontFamily: typography.display,
    fontSize: typography.size.sm,
  },
});
