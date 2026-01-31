import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { spacing, radius, typography } from '../lib/theme';
import { useTheme } from '../hooks/useTheme';

type BlockType = 'mute' | 'soft' | 'hard';

// Moved outside component to prevent recreation on each render
const BLOCK_OPTIONS: ReadonlyArray<{
  type: BlockType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    type: 'mute',
    title: 'Mute',
    description: "You won't see their presence or updates, but they can still see yours",
    icon: '🔇',
  },
  {
    type: 'soft',
    title: 'Soft Block',
    description: 'You appear offline to them. They can still send nudges (which you can ignore)',
    icon: '👻',
  },
  {
    type: 'hard',
    title: 'Hard Block',
    description: 'Complete removal. They disappear from your friends list',
    icon: '🚫',
  },
] as const;

interface BlockModalProps {
  visible: boolean;
  onClose: () => void;
  onBlock: (blockType: BlockType) => void;
  userName: string;
}

export const BlockModal: React.FC<BlockModalProps> = ({
  visible,
  onClose,
  onBlock,
  userName,
}) => {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<BlockType | null>(null);

  const getBlockColor = useCallback((type: BlockType) => {
    switch (type) {
      case 'mute':
        return colors.status.neutral;
      case 'soft':
        return colors.status.warning;
      case 'hard':
        return colors.status.error;
    }
  }, [colors]);

  const handleConfirm = useCallback(() => {
    if (selectedType) {
      onBlock(selectedType);
      setSelectedType(null);
      onClose();
    }
  }, [selectedType, onBlock, onClose]);

  const handleCancel = useCallback(() => {
    setSelectedType(null);
    onClose();
  }, [onClose]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      width: '85%',
      maxWidth: 400,
      maxHeight: '80%',
    },
    modal: {
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.glass.border,
    },
    header: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.glass.border,
    },
    title: {
      fontSize: typography.sizes['2xl'],
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: typography.sizes.sm,
      color: colors.text.secondary,
    },
    optionsList: {
      maxHeight: 400,
    },
    optionsContent: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    optionCard: {
      backgroundColor: colors.glass.background,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 2,
      borderColor: colors.glass.border,
    },
    optionCardSelected: {
      borderColor: colors.status.info,
      backgroundColor: colors.bg.tertiary,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    optionIcon: {
      fontSize: 32,
      marginRight: spacing.md,
    },
    optionInfo: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    optionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
    },
    checkmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkmarkText: {
      color: colors.text.primary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
    },
    optionDescription: {
      fontSize: typography.sizes.sm,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    buttons: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.glass.border,
    },
    cancelButton: {
      flex: 1,
      padding: spacing.md,
      borderRadius: radius.full,
      backgroundColor: colors.glass.background,
      borderWidth: 1,
      borderColor: colors.glass.border,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text.secondary,
    },
    confirmButton: {
      flex: 1,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    confirmButtonDisabled: {
      opacity: 0.5,
    },
    confirmGradient: {
      padding: spacing.md,
      alignItems: 'center',
    },
    confirmText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text.primary,
    },
    confirmTextDisabled: {
      color: colors.text.tertiary,
    },
  }), [colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <BlurView intensity={80} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <BlurView intensity={30} style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">Block {userName}</Text>
              <Text style={styles.subtitle}>All blocks are silent - they won't know</Text>
            </View>

            {/* Block Options */}
            <ScrollView
              style={styles.optionsList}
              contentContainerStyle={styles.optionsContent}
              showsVerticalScrollIndicator={false}
            >
              {BLOCK_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.type}
                  onPress={() => setSelectedType(option.type)}
                  style={[
                    styles.optionCard,
                    selectedType === option.type && styles.optionCardSelected,
                  ]}
                  accessibilityLabel={`${option.title}: ${option.description}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedType === option.type }}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      {selectedType === option.type && (
                        <View style={[styles.checkmark, { backgroundColor: getBlockColor(option.type) }]}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Buttons */}
            <View style={styles.buttons}>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.cancelButton}
                accessibilityLabel="Cancel"
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!selectedType}
                style={[styles.confirmButton, !selectedType && styles.confirmButtonDisabled]}
                accessibilityLabel="Confirm block"
                accessibilityRole="button"
                accessibilityState={{ disabled: !selectedType }}
              >
                <LinearGradient
                  colors={
                    selectedType
                      ? [colors.status.error, colors.status.error]
                      : [colors.bg.secondary, colors.bg.tertiary]
                  }
                  style={styles.confirmGradient}
                >
                  <Text style={[styles.confirmText, !selectedType && styles.confirmTextDisabled]}>
                    Block
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </BlurView>
    </Modal>
  );
};

