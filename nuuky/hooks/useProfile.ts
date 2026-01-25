import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../stores/appStore';

interface ImagePickerResult {
  cancelled: boolean;
  uri?: string;
}

export const useProfile = () => {
  const { currentUser, setCurrentUser } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const updateDisplayName = async (name: string): Promise<boolean> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    // Validate display name (1-50 chars)
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      Alert.alert('Invalid Name', 'Display name cannot be empty');
      return false;
    }
    if (trimmedName.length > 50) {
      Alert.alert('Invalid Name', 'Display name must be 50 characters or less');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: trimmedName })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update store
      setCurrentUser({ ...currentUser, display_name: trimmedName });
      Alert.alert('Success', 'Display name updated');
      return true;
    } catch (error: any) {
      console.error('Error updating display name:', error);
      Alert.alert('Error', 'Failed to update display name');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadAvatar = async (
    source: 'camera' | 'gallery'
  ): Promise<boolean> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    try {
      // Request permissions
      let permissionResult;
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          `Please allow access to your ${source === 'camera' ? 'camera' : 'photo library'} in settings.`
        );
        return false;
      }

      // Pick image
      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (result.canceled) {
        return false;
      }

      const imageUri = result.assets[0].uri;
      
      // Upload image
      setLoading(true);
      setUploadProgress(0);

      // Create file path
      const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

      // Fetch the image
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatarUrl = urlData.publicUrl;

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Update store
      setCurrentUser({ ...currentUser, avatar_url: avatarUrl });
      
      Alert.alert('Success', 'Profile picture updated');
      return true;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
      return false;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const deleteAvatar = async (): Promise<boolean> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    if (!currentUser.avatar_url) {
      Alert.alert('No Avatar', 'You do not have a profile picture to delete');
      return false;
    }

    setLoading(true);
    try {
      // Extract file path from URL
      const url = new URL(currentUser.avatar_url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // Get user_id/filename.ext

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Update store
      setCurrentUser({ ...currentUser, avatar_url: undefined });
      
      Alert.alert('Success', 'Profile picture deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting avatar:', error);
      Alert.alert('Error', 'Failed to delete profile picture');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async (): Promise<boolean> => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in');
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', currentUser.id);

      if (error) throw error;

      // Update store
      setCurrentUser({ ...currentUser, profile_completed: true });
      return true;
    } catch (error: any) {
      console.error('Error completing profile:', error);
      Alert.alert('Error', 'Failed to complete profile setup');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    uploadProgress,
    updateDisplayName,
    pickAndUploadAvatar,
    deleteAvatar,
    completeProfile,
  };
};
