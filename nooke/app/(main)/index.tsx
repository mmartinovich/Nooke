import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

// AsyncStorage with fallback for when package isn't installed
// TODO: Install @react-native-async-storage/async-storage package: npm install @react-native-async-storage/async-storage
let AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (e) {
  // Fallback to in-memory storage if package not installed
  const memoryStorage: Record<string, string> = {};
  AsyncStorage = {
    getItem: async (key: string) => memoryStorage[key] || null,
    setItem: async (key: string, value: string) => {
      memoryStorage[key] = value;
    },
    removeItem: async (key: string) => {
      delete memoryStorage[key];
    },
  };
}
import { useAppStore } from "../../stores/appStore";
import { User } from "../../types";
import { MoodPicker } from "../../components/MoodPicker";
import { useMood } from "../../hooks/useMood";
import { useNudge } from "../../hooks/useNudge";
import { useFlare } from "../../hooks/useFlare";
import { usePresence } from "../../hooks/usePresence";
import {
  colors,
  getMoodColor,
  getVibeText,
  getMoodEmoji,
  gradients,
  spacing,
  radius,
  typography,
} from "../../lib/theme";
import { CentralOrb } from "../../components/CentralOrb";
import { FriendParticle } from "../../components/FriendParticle";
import { StarField } from "../../components/StarField";

const { width, height } = Dimensions.get("window");
const CENTER_X = width / 2;
const CENTER_Y = height / 2;

export default function QuantumOrbitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, friends, setFriends } = useAppStore();
  const { currentMood, changeMood } = useMood();
  const { sendNudge } = useNudge();
  const { sendFlare, activeFlares, myActiveFlare } = useFlare();
  const { updateActivity } = usePresence(); // Track presence while app is active
  const [loading, setLoading] = useState(true);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showHint, setShowHint] = useState(true); // Show hint by default until user interacts

  // All hooks must be called before any conditional returns
  const currentVibe = useMemo(() => getVibeText(currentUser?.mood || "neutral"), [currentUser?.mood]);
  const moodEmoji = getMoodEmoji(currentUser?.mood || "neutral");

  // Calculate friend list and positions - must be before conditional returns
  const friendList = friends.map((f) => f.friend as User);

  // Organic layout algorithm - calculate positions for friends
  const calculateFriendPositions = (count: number) => {
    const positions: Array<{ x: number; y: number }> = [];
    const baseRadius = 150; // Base distance from center (increased)
    const minDistance = 100; // Minimum distance between particles (increased to prevent overlap with orbital rotation)
    const safeZoneTop = 200; // Avoid top card
    const safeZoneBottom = height - 100; // Avoid bottom nav
    const safeZoneLeft = 50;
    const safeZoneRight = width - 50;

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      let validPosition = false;
      let x = 0;
      let y = 0;

      while (!validPosition && attempts < 100) {
        // Polar coordinates with more even distribution
        const angle = (i / count) * 2 * Math.PI + (Math.random() - 0.5) * 0.4; // Reduced random variation
        const radius = baseRadius + (Math.random() - 0.5) * 30; // Reduced radius variation

        x = CENTER_X + Math.cos(angle) * radius;
        y = CENTER_Y + Math.sin(angle) * radius;

        // Check safe zones
        if (y > safeZoneTop && y < safeZoneBottom && x > safeZoneLeft && x < safeZoneRight) {
          // Check distance from other particles (accounting for orbital rotation radius)
          let tooClose = false;
          for (const pos of positions) {
            const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
            // Account for orbital rotation - particles can move closer during rotation
            // So we need more spacing initially
            if (distance < minDistance) {
              tooClose = true;
              break;
            }
          }

          if (!tooClose) {
            validPosition = true;
          }
        }

        attempts++;
      }

      // If we couldn't find a valid position, use a fallback with even spacing
      if (!validPosition) {
        const angle = (i / count) * 2 * Math.PI;
        const radius = baseRadius + (i % 2) * 20; // Alternate radius for spacing
        x = CENTER_X + Math.cos(angle) * radius;
        y = CENTER_Y + Math.sin(angle) * radius;
      }

      positions.push({ x, y });
    }

    return positions;
  };

  const friendPositions = useMemo(() => calculateFriendPositions(friendList.length), [friendList.length]);

  useEffect(() => {
    if (currentUser) {
      loadFriends();
      loadHintState();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [currentUser]);

  const loadHintState = async () => {
    try {
      const hasInteracted = await AsyncStorage.getItem("hasInteractedWithOrb");
      if (hasInteracted === "true") {
        setShowHint(false);
      }
    } catch (error) {
      console.error("Error loading hint state:", error);
      // Default to showing hint if there's an error
    }
  };

  const saveInteractionState = async () => {
    try {
      await AsyncStorage.setItem("hasInteractedWithOrb", "true");
      setShowHint(false);
    } catch (error) {
      console.error("Error saving interaction state:", error);
    }
  };

  const loadFriends = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("friendships")
        .select(
          `
          *,
          friend:friend_id (
            id,
            display_name,
            mood,
            is_online,
            last_seen_at,
            avatar_url
          )
        `
        )
        .eq("user_id", currentUser.id)
        .eq("status", "accepted");

      if (error) throw error;

      // Mock friends for testing with avatars
      const mockFriends: any[] = [
        {
          id: "mock-1",
          user_id: currentUser.id,
          friend_id: "friend-1",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-1",
            phone: "+1234567890",
            display_name: "Alex",
            mood: "good",
            is_online: true,
            last_seen_at: new Date().toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=1",
            created_at: new Date().toISOString(),
          },
        },
        {
          id: "mock-2",
          user_id: currentUser.id,
          friend_id: "friend-2",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-2",
            phone: "+1234567891",
            display_name: "Sam",
            mood: "neutral",
            is_online: false,
            last_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=5",
            created_at: new Date().toISOString(),
          },
        },
        {
          id: "mock-3",
          user_id: currentUser.id,
          friend_id: "friend-3",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-3",
            phone: "+1234567892",
            display_name: "Jordan",
            mood: "not_great",
            is_online: true,
            last_seen_at: new Date().toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=12",
            created_at: new Date().toISOString(),
          },
        },
        {
          id: "mock-4",
          user_id: currentUser.id,
          friend_id: "friend-4",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-4",
            phone: "+1234567893",
            display_name: "Taylor",
            mood: "reach_out",
            is_online: false,
            last_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=47",
            created_at: new Date().toISOString(),
          },
        },
        {
          id: "mock-5",
          user_id: currentUser.id,
          friend_id: "friend-5",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-5",
            phone: "+1234567894",
            display_name: "Riley",
            mood: "good",
            is_online: true,
            last_seen_at: new Date().toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=33",
            created_at: new Date().toISOString(),
          },
        },
      ];

      // Use mock friends for now (comment out the real data line)
      setFriends(mockFriends);
      // setFriends(data || []);
    } catch (error: any) {
      console.error("Error loading friends:", error);
      // Even on error, show mock friends with avatars
      const mockFriends: any[] = [
        {
          id: "mock-1",
          user_id: currentUser.id,
          friend_id: "friend-1",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-1",
            phone: "+1234567890",
            display_name: "Alex",
            mood: "good",
            is_online: true,
            last_seen_at: new Date().toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=1",
            created_at: new Date().toISOString(),
          },
        },
        {
          id: "mock-2",
          user_id: currentUser.id,
          friend_id: "friend-2",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-2",
            phone: "+1234567891",
            display_name: "Sam",
            mood: "neutral",
            is_online: false,
            last_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=5",
            created_at: new Date().toISOString(),
          },
        },
        {
          id: "mock-3",
          user_id: currentUser.id,
          friend_id: "friend-3",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-3",
            phone: "+1234567892",
            display_name: "Jordan",
            mood: "not_great",
            is_online: true,
            last_seen_at: new Date().toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=12",
            created_at: new Date().toISOString(),
          },
        },
        {
          id: "mock-4",
          user_id: currentUser.id,
          friend_id: "friend-4",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-4",
            phone: "+1234567893",
            display_name: "Taylor",
            mood: "reach_out",
            is_online: false,
            last_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=47",
            created_at: new Date().toISOString(),
          },
        },
        {
          id: "mock-5",
          user_id: currentUser.id,
          friend_id: "friend-5",
          status: "accepted",
          visibility: "full",
          created_at: new Date().toISOString(),
          last_interaction_at: new Date().toISOString(),
          friend: {
            id: "friend-5",
            phone: "+1234567894",
            display_name: "Riley",
            mood: "good",
            is_online: true,
            last_seen_at: new Date().toISOString(),
            avatar_url: "https://i.pravatar.cc/150?img=33",
            created_at: new Date().toISOString(),
          },
        },
      ];
      setFriends(mockFriends);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!currentUser) return () => {};

    const channel = supabase
      .channel("presence-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
        },
        () => {
          loadFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFriendPress = (friend: User) => {
    const moodLabel = getMoodLabel(friend.mood);
    const statusText = friend.is_online ? "Online now" : `Last seen: ${new Date(friend.last_seen_at).toLocaleString()}`;

    Alert.alert(friend.display_name, `${moodLabel}\n${statusText}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send Nudge 👋",
        onPress: () => sendNudge(friend.id, friend.display_name),
      },
    ]);
  };

  const getMoodLabel = (mood: User["mood"]) => {
    switch (mood) {
      case "good":
        return "Feeling good";
      case "neutral":
        return "Neutral";
      case "not_great":
        return "Not great";
      case "reach_out":
        return "Need support";
      default:
        return "Neutral";
    }
  };

  const handleOrbPress = () => {
    // Hide hint on first interaction
    if (showHint) {
      saveInteractionState();
    }
    setShowMoodPicker(true);
  };

  const handleFlarePress = async () => {
    if (myActiveFlare) {
      Alert.alert("Flare Active", "You already have an active flare. Only one flare can be active at a time.");
      return;
    }
    await sendFlare();
  };

  if (loading) {
    return (
      <LinearGradient colors={gradients.background} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>✨ loading your vibe...</Text>
        </View>
      </LinearGradient>
    );
  }

  const userMoodColors = getMoodColor(currentUser?.mood || "neutral");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Neon Cyber Background */}
      <LinearGradient colors={gradients.background} style={StyleSheet.absoluteFill} />

      {/* Animated Star Field */}
      <StarField />

      {/* Central Orb - Your Presence */}
      <CentralOrb
        moodColor={userMoodColors.base}
        glowColor={userMoodColors.glow}
        onPress={() => {
          updateActivity(); // Track activity on interaction
          handleOrbPress();
        }}
        hasActiveFlare={!!myActiveFlare}
        mood={currentUser?.mood}
        showHint={showHint}
      />

      {/* Friend Particles - Organic Layout (rendered after central orb to appear on top) */}
      {friendList.map((friend, index) => (
        <FriendParticle
          key={friend.id}
          friend={friend}
          index={index}
          total={friendList.length}
          onPress={() => handleFriendPress(friend)}
          hasActiveFlare={activeFlares.some((f: any) => f.user_id === friend.id)}
          position={friendPositions[index] || { x: CENTER_X, y: CENTER_Y }}
        />
      ))}

      {/* Top Header - Simple Text */}
      <View style={styles.topHeader} pointerEvents="box-none">
        <Text style={styles.appTitle}>Nookē</Text>
        <Text style={styles.moodText}>
          {currentVibe} {moodEmoji}
        </Text>
      </View>

      {/* iOS-Style Bottom Navigation */}
      <View style={styles.bottomNav} pointerEvents="box-none">
        <BlurView intensity={80} tint="dark" style={[styles.navContainer, { paddingBottom: insets.bottom }]}>
          <View style={styles.navContent}>
            {/* Flare Tab - First position, red color */}
            <TouchableOpacity
              onPress={handleFlarePress}
              activeOpacity={0.7}
              disabled={!!myActiveFlare}
              style={styles.navTab}
            >
              <Ionicons name="flame" size={24} color="#FF3B30" />
              <Text style={[styles.navLabel, myActiveFlare && styles.navLabelActive]}>
                {myActiveFlare ? "Active" : "Flare"}
              </Text>
            </TouchableOpacity>

            {/* Friends Tab */}
            <TouchableOpacity onPress={() => router.push("/(main)/friends")} activeOpacity={0.7} style={styles.navTab}>
              <Feather name="users" size={24} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.navLabel}>Friends</Text>
            </TouchableOpacity>

            {/* Profile Tab */}
            <TouchableOpacity onPress={() => router.push("/(main)/profile")} activeOpacity={0.7} style={styles.navTab}>
              <Feather name="user" size={24} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.navLabel}>Profile</Text>
            </TouchableOpacity>

            {/* Settings Tab */}
            <TouchableOpacity onPress={() => router.push("/(main)/settings")} activeOpacity={0.7} style={styles.navTab}>
              <Feather name="settings" size={24} color="rgba(255, 255, 255, 0.85)" />
              <Text style={styles.navLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* Active Flares Alert */}
      {activeFlares.length > 0 && (
        <View style={styles.flaresAlert}>
          <BlurView intensity={50} tint="dark" style={styles.flaresBlur}>
            <LinearGradient
              colors={gradients.neonPink}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.flaresGradient}
            >
              <Text style={styles.flaresTitle}>
                🚨 {activeFlares.length} friend{activeFlares.length > 1 ? "s" : ""} need u rn
              </Text>
              {activeFlares.slice(0, 2).map((flare: any) => (
                <Text key={flare.id} style={styles.flaresText}>
                  💜 {flare.user.display_name}
                </Text>
              ))}
            </LinearGradient>
          </BlurView>
        </View>
      )}

      {/* Mood Picker Modal */}
      <MoodPicker
        visible={showMoodPicker}
        currentMood={currentMood}
        onSelectMood={changeMood}
        onClose={() => setShowMoodPicker(false)}
      />

      {/* Grain Overlay */}
      <View style={styles.grain} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 18,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  topHeader: {
    position: "absolute",
    top: 70,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  moodText: {
    fontSize: 17,
    color: colors.text.secondary,
    marginTop: 6,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  // iOS-Style Bottom Navigation
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navContainer: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 0.33,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  navContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 0,
    height: 49,
  },
  navTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 49,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: 0.1,
    marginTop: 2,
  },
  navLabelActive: {
    color: "rgba(255, 255, 255, 0.95)",
    fontWeight: "600",
  },
  flaresAlert: {
    position: "absolute",
    top: 160,
    left: 20,
    right: 20,
  },
  flaresBlur: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.neon.pink,
    shadowColor: colors.neon.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 15,
  },
  flaresGradient: {
    padding: 18,
  },
  flaresTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 10,
    textTransform: "lowercase",
  },
  flaresText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 6,
    fontWeight: "600",
  },
  grain: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 240, 255, 0.01)",
    opacity: 0.3,
    pointerEvents: "none",
  },
});
