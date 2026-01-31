import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius } from '../lib/theme';
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
      {/* Selected emoji or placeholder inline with the grid */}
      <View style={styles.row}>
        <View
          style={[
            styles.selectedBox,
            { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.glass.border },
          ]}
        >
          {value ? (
            <Text style={styles.selectedEmoji}>{value}</Text>
          ) : (
            <Ionicons name="happy-outline" size={28} color={theme.colors.text.tertiary} />
          )}
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
                  backgroundColor: theme.colors.accent.primary + '4D',
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedEmoji: {
    fontSize: 32,
  },
  emojiGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 24,
  },
});
