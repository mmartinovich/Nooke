import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { AntDesign } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAppStore } from "../../stores/appStore";
import { colors, gradients, typography, spacing, radius } from "../../lib/theme";
import Constants from "expo-constants";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setCurrentUser } = useAppStore();

  // Subtle pulse animation for the orb
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Configure Google Sign-In
    const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
    if (webClientId) {
      GoogleSignin.configure({
        webClientId: webClientId,
        iosClientId: Constants.expoConfig?.extra?.googleIosClientId, // Optional, for iOS
      });
    }

    // Start pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseAnimation.start();

    // Cleanup on unmount
    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const fetchUserProfile = async (userId: string): Promise<{ userData: any; needsOnboarding: boolean } | null> => {
    console.log("[Auth] fetchUserProfile called for userId:", userId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("[Auth] getUser result:", user?.id);

    let { data: userData, error: fetchError } = await supabase.from("users").select("*").eq("id", userId).single();
    console.log("[Auth] Fetched user profile:", userData?.id, "error:", fetchError?.message);

    if (!userData && user) {
      console.log("[Auth] Creating new user profile...");
      // Create profile for OAuth user (fallback if trigger doesn't work)
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: user.email!,
          display_name:
            user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
          auth_provider: user.app_metadata?.provider || "google",
          is_online: true,
          profile_completed: false, // New users need onboarding
        })
        .select()
        .single();
      console.log("[Auth] Insert result:", newUser?.id, "error:", insertError?.message);
      userData = newUser;
    }

    if (userData) {
      console.log("[Auth] Setting current user, profile_completed:", userData.profile_completed);
      setCurrentUser(userData);
      return { userData, needsOnboarding: userData.profile_completed === false };
    }
    console.log("[Auth] No user data found, returning null");
    return null;
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Not Available", "Sign in with Apple is not available on this device.");
        return;
      }

      // Generate a random nonce (unhashed)
      const randomBytes = Crypto.getRandomBytes(32);
      const randomString = Array.from(randomBytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

      // Hash the nonce with SHA-256
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        randomString
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      // Use the original unhashed nonce for Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken!,
        nonce: randomString,
      });

      if (error) {
        console.log("[Auth] Apple signInWithIdToken error:", error.message);
        throw error;
      }
      console.log("[Auth] Apple sign in success, user id:", data.user.id);

      // Fetch or create user profile and navigate directly
      const result = await fetchUserProfile(data.user.id);
      console.log("[Auth] fetchUserProfile result:", result);
      if (result) {
        // Navigate directly based on profile completion - avoids race condition with index.tsx
        console.log("[Auth] Navigating to:", result.needsOnboarding ? "onboarding" : "main");
        if (result.needsOnboarding) {
          router.replace("/(auth)/onboarding");
        } else {
          router.replace("/(main)");
        }
      } else {
        console.log("[Auth] No result from fetchUserProfile - this is the problem!");
        Alert.alert("Sign In Error", "Could not fetch user profile. Please try again.");
      }
    } catch (error: any) {
      console.log("[Auth] Apple sign in catch block:", error.code, error.message);
      if (error.code === "ERR_REQUEST_CANCELED") {
        // User cancelled the sign-in
        return;
      }
      Alert.alert("Sign In Failed", error.message || "Failed to sign in with Apple");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error("No ID token received from Google");
      }

      // Sign in to Supabase with the Google ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo.data.idToken,
      });

      if (error) {
        console.log("[Auth] Google signInWithIdToken error:", error.message);
        throw error;
      }
      console.log("[Auth] Google sign in success, user id:", data.user.id);

      // Fetch or create user profile and navigate directly
      const result = await fetchUserProfile(data.user.id);
      console.log("[Auth] fetchUserProfile result:", result);
      if (result) {
        // Navigate directly based on profile completion - avoids race condition with index.tsx
        console.log("[Auth] Navigating to:", result.needsOnboarding ? "onboarding" : "main");
        if (result.needsOnboarding) {
          router.replace("/(auth)/onboarding");
        } else {
          router.replace("/(main)");
        }
      } else {
        console.log("[Auth] No result from fetchUserProfile - this is the problem!");
        Alert.alert("Sign In Error", "Could not fetch user profile. Please try again.");
      }
    } catch (error: any) {
      console.log("[Auth] Google sign in catch block:", error.code, error.message);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the sign-in
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in is in progress
        Alert.alert("Please wait", "Sign in is already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Error", "Google Play Services not available or outdated");
      } else {
        Alert.alert("Sign In Failed", error.message || "Failed to sign in with Google");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <LinearGradient colors={gradients.background} style={styles.gradient}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.content}>
          {/* Title - Centered */}
          <View style={styles.header}>
            <Image source={require("../../assets/wordmark.png")} style={styles.wordmark} resizeMode="contain" />
            <Text style={styles.subtitle}>Feel connected without{"\n"}the pressure of communicating</Text>
          </View>
        </View>

        {/* OAuth Buttons - Bottom */}
        <View style={styles.bottomSection}>
          <View style={styles.authButtons}>
            {/* Apple Sign-In */}
            {Platform.OS === 'ios' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)']}
                  style={styles.authButton}
                >
                  {/* Neon border glow */}
                  <View style={[styles.buttonBorder, { borderColor: 'rgba(255, 255, 255, 0.3)' }]} />

                  {/* Apple Icon */}
                  <View style={styles.iconContainer}>
                    <AntDesign name="apple" size={24} color={colors.text.primary} />
                  </View>

                  <Text style={styles.buttonText}>
                    {loading ? "Signing in..." : "Continue with Apple"}
                  </Text>

                  {/* Subtle shine effect */}
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.15)', 'transparent']}
                    style={styles.buttonShine}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Google Sign-In */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)']}
                style={styles.authButton}
              >
                {/* Neon border glow */}
                <View style={[styles.buttonBorder, { borderColor: 'rgba(0, 240, 255, 0.4)' }]} />

                {/* Google Icon */}
                <View style={styles.iconContainer}>
                  <AntDesign name="google" size={24} color="#4285F4" />
                </View>

                <Text style={styles.buttonText}>
                  {loading ? "Signing in..." : "Continue with Google"}
                </Text>

                {/* Subtle shine effect */}
                <LinearGradient
                  colors={['rgba(0, 240, 255, 0.1)', 'transparent']}
                  style={styles.buttonShine}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.privacyText}>By continuing, you agree to our terms and privacy policy</Text>
        </View>

        {/* Subtle grain texture overlay */}
        <View style={styles.grain} pointerEvents="none" />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
  },
  wordmark: {
    width: 200,
    height: 80,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size["5xl"],
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },
  bottomSection: {
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
  },
  authButtons: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
  },
  buttonBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
  },
  buttonShine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "50%",
    height: "100%",
    pointerEvents: "none",
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    letterSpacing: 0.2,
  },
  privacyText: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: spacing.md,
  },
  grain: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    opacity: 0.5,
  },
});
