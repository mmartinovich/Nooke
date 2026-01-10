import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoom } from '../../../hooks/useRoom';
import { RoomView } from '../../../components/RoomView';
import { colors } from '../../../lib/theme';
import { useAppStore } from '../../../stores/appStore';

export default function RoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUser } = useAppStore();
  const { currentRoom, participants, joinRoom, leaveRoom, loading } = useRoom();

  useEffect(() => {
    if (id && currentUser) {
      // Join the room when screen mounts
      handleJoinRoom();
    }

    // Leave room when navigating away
    return () => {
      if (currentRoom) {
        leaveRoom();
      }
    };
  }, [id]);

  const handleJoinRoom = async () => {
    if (!id) return;

    const success = await joinRoom(id);
    if (!success) {
      Alert.alert('Error', 'Failed to join room', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    }
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    router.back();
  };

  if (!currentRoom || loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <RoomView
        roomName={currentRoom.name}
        participants={participants}
        isCreator={currentRoom.creator_id === currentUser?.id}
        onLeave={handleLeaveRoom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
});
