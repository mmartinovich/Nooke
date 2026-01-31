import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { EmojiInput } from './EmojiInput';
import { radius, CUSTOM_MOOD_NEUTRAL_COLOR } from '../lib/theme';
import { useTheme } from '../hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomMoodEditorProps {
  visible: boolean;
  onSave: (emoji: string, text: string, color: string) => void;
  onClose: () => void;
  initialEmoji?: string;
  initialText?: string;
}

export const CustomMoodEditor: React.FC<CustomMoodEditorProps> = ({
  visible,
  onSave,
  onClose,
  initialEmoji = '',
  initialText = '',
}) => {
  const { theme, accent } = useTheme();
  const [emoji, setEmoji] = useState(initialEmoji);
  const [text, setText] = useState(initialText);

  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Sync state when modal opens with existing custom mood data
  useEffect(() => {
    if (visible) {
      setEmoji(initialEmoji);
      setText(initialText);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const canSave = emoji.trim().length > 0 && text.trim().length > 0;

  const handleSave = () => {
    const cleanedEmoji = emoji.trim();

    if (!cleanedEmoji) {
      Alert.alert('Missing Emoji', 'Please select an emoji');
      return;
    }

    if (!text || text.trim().length < 1) {
      Alert.alert('Missing Message', 'Please add a status message');
      return;
    }

    if (text.length > 50) {
      Alert.alert('Message Too Long', 'Status message must be 50 characters or less');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSave(cleanedEmoji, text.trim(), CUSTOM_MOOD_NEUTRAL_COLOR);
    handleClose();
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEmoji('');
    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.ui.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={theme.gradients.background}
              style={[styles.gradientBackground, { borderColor: theme.colors.glass.border }]}
            >
              {/* Header */}
              <View style={styles.headerSection}>
                <View style={styles.headerText}>
                  <Text style={[styles.title, { color: theme.colors.text.primary }]}>Custom Mood</Text>
                  <Text style={[styles.subtitle, { color: theme.colors.text.tertiary }]}>Make it yours!</Text>
                </View>
              </View>

              {/* Emoji Input */}
              <View style={styles.inputSection}>
                <EmojiInput
                  value={emoji}
                  onChangeEmoji={setEmoji}
                />
              </View>

              {/* Status Message */}
              <View style={styles.inputSection}>
                <Text style={[styles.sectionLabel, { color: theme.colors.text.tertiary }]}>STATUS MESSAGE</Text>
                <View style={[styles.inputCard, { backgroundColor: theme.colors.glass.background, borderColor: theme.colors.glass.border }]}>
                  <TextInput
                    style={[styles.input, { color: theme.colors.text.primary }]}
                    value={text}
                    onChangeText={setText}
                    placeholder="How are you feeling?"
                    placeholderTextColor={theme.colors.text.tertiary}
                    maxLength={50}
                    returnKeyType="done"
                  />
                </View>
                <Text style={[styles.charCount, { color: theme.colors.text.tertiary }]}>{text.length}/50</Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttons}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={[styles.cancelButton, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: '#EF4444' }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={[
                    styles.saveButton,
                    { backgroundColor: canSave ? accent.primary : theme.colors.glass.background },
                  ]}
                  activeOpacity={0.7}
                  disabled={!canSave}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: canSave ? '#FFFFFF' : theme.colors.text.tertiary },
                    ]}
                  >
                    Save & Use
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 360,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  gradientBackground: {
    padding: 24,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  // Header
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  // Input Sections
  inputSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  inputCard: {
    borderRadius: radius.md,
    borderWidth: 1,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
