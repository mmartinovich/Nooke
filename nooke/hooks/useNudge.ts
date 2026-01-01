import { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';

export const useNudge = () => {
  const { currentUser } = useAppStore();
  const [loading, setLoading] = useState(false);

  const sendNudge = async (friendId: string, friendName: string): Promise<boolean> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    setLoading(true);
    try {
      // Try to insert the nudge - the database trigger will check rate limits
      const { error } = await supabase
        .from('nudges')
        .insert({
          sender_id: currentUser.id,
          receiver_id: friendId,
        });

      if (error) {
        // Check if it's a rate limit error
        if (error.message.includes('Nudge limit exceeded')) {
          Alert.alert(
            'Limit Reached',
            `You can only send 3 nudges per friend per day. Try again tomorrow!`
          );
        } else {
          throw error;
        }
        return false;
      }

      // Success - play haptic feedback
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      Alert.alert(
        'Nudge Sent! 👋',
        `${friendName} will feel a gentle vibration`,
        [{ text: 'OK', style: 'default' }]
      );

      return true;
    } catch (error: any) {
      console.error('Error sending nudge:', error);
      Alert.alert('Error', 'Failed to send nudge');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const receiveNudge = async () => {
    // Play gentle haptic feedback for receiving a nudge
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return {
    loading,
    sendNudge,
    receiveNudge,
  };
};
