import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { typography, spacing, radius } from '../lib/theme';
import { useTheme } from '../hooks/useTheme';

const POPULAR_EMOJIS = [
  '😊', '😎', '🥳', '😴', '🤔', '😤', '🥺', '❤️',
  '🔥', '✨', '💪', '🎉', '🌟', '💯', '🙏', '👋',
  '☕', '🎮', '📚', '💼', '🏃', '🎵', '🌈', '⚡',
];

interface EmojiInputProps {
  value: string;
  onChangeEmoji: (emoji: string) => void;
  placeholder?: string;
}

export const EmojiInput: React.FC<EmojiInputProps> = ({
  value,
  onChangeEmoji,
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Pick an Emoji</Text>

      {/* Selected emoji display */}
      <View style={styles.selectedWrapper}>
        <Text style={[styles.selectedEmoji, { color: theme.colors.text.primary }]}>{value || '+'}</Text>
      </View>

      {/* Emoji grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.emojiGrid}
      >
        {POPULAR_EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.emojiButton,
              { backgroundColor: theme.colors.glass.background },
              value === emoji && {
                backgroundColor: theme.colors.accent.primary + '4D', // 30% opacity
                borderWidth: 2,
                borderColor: theme.colors.accent.primary,
              },
            ]}
            onPress={() => onChangeEmoji(emoji)}
            activeOpacity={0.7}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    // color set inline via theme
    marginBottom: spacing.sm,
  },
  selectedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  selectedEmoji: {
    fontSize: 56,
    // color set inline via theme
  },
  emojiGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor set inline via theme
  },
  emojiText: {
    fontSize: 24,
  },
});
