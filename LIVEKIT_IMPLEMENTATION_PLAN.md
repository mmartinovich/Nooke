# LiveKit Audio Integration Plan for Nooke

## Prerequisites: LiveKit Cloud Setup

### Step 1: Create LiveKit Cloud Account
1. Go to https://cloud.livekit.io
2. Sign up for a free account (free tier includes 50 participant-hours/month)
3. Create a new project

### Step 2: Get Credentials
From your LiveKit Cloud dashboard:
- **API Key**: Found in Settings → Keys (format: `APIxxxxxxxx`)
- **API Secret**: Generate a new secret key
- **WebSocket URL**: Your project URL (format: `wss://your-project.livekit.cloud`)

### Step 3: Add to Supabase Secrets
```bash
supabase secrets set LIVEKIT_API_KEY=your-api-key
supabase secrets set LIVEKIT_API_SECRET=your-api-secret
supabase secrets set LIVEKIT_URL=wss://your-project.livekit.cloud
```

---

## Overview
Implement two-layer audio system:
- **Layer 1 (Presence)**: Supabase Realtime - already working
- **Layer 2 (Audio)**: LiveKit - connect ONLY when someone unmutes, disconnect after 30s silence

**Cost savings**: 80-95% reduction vs always-on audio

---

## Phase 1: Package Installation & Config

### 1.1 Install Dependencies
```bash
cd nooke
npx expo install @livekit/react-native @livekit/react-native-webrtc livekit-client
npm install livekit-server-sdk  # For Edge Function
```

### 1.2 Update `app.config.js`
Add to plugins array:
```javascript
"@livekit/react-native-expo-plugin",
```

### 1.3 Environment Variables
Add to `.env`:
```
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
EXPO_PUBLIC_LIVEKIT_URL=wss://your-server.livekit.cloud
```

---

## Phase 2: Type Definitions

### Update `nooke/types/index.ts`
```typescript
export type AudioConnectionStatus =
  | 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface ParticipantAudioState {
  participantId: string;
  isSpeaking: boolean;
  audioLevel: number;
  isMuted: boolean;
}
```

---

## Phase 3: State Management

### Update `nooke/stores/appStore.ts`
Add:
```typescript
// State
audioConnectionStatus: AudioConnectionStatus;
audioError: string | null;
speakingParticipants: Set<string>;

// Actions
setAudioConnectionStatus: (status) => void;
setAudioError: (error) => void;
addSpeakingParticipant: (userId) => void;
removeSpeakingParticipant: (userId) => void;
clearSpeakingParticipants: () => void;
```

---

## Phase 4: Supabase Edge Function

### Create `supabase/functions/livekit-token/index.ts`
- Verify user JWT
- Verify user is room participant
- Generate LiveKit access token with 2h TTL
- Return token, roomName, serverUrl

---

## Phase 5: LiveKit Client Library

### Create `nooke/lib/livekit.ts`
Key functions:
- `initializeLiveKit()` - Register WebRTC globals (call once at startup)
- `connectToAudioRoom(roomId)` - Get token, connect to LiveKit, enable mic
- `disconnectFromAudioRoom()` - Disconnect, stop audio session
- `setLocalMicrophoneEnabled(enabled)` - Toggle mic
- `isAnyoneUnmuted()` - Check if audio layer needed

Key features:
- 30-second silence timer that triggers `onAllMuted` callback
- Speaking detection via `ActiveSpeakersChanged` event
- Auto-reconnection handling

---

## Phase 6: Audio Hook

### Create `nooke/hooks/useAudio.ts`
```typescript
export const useAudio = (roomId: string | null) => {
  return {
    connectionStatus,
    isConnected,
    isConnecting,
    speakingParticipants,
    isParticipantSpeaking: (userId) => boolean,
    connect: () => Promise<boolean>,  // Called on unmute
    disconnect: () => Promise<void>,
    mute: () => Promise<void>,
    unmute: () => Promise<boolean>,
  };
};
```

Handles:
- Microphone permission requests
- Connecting to LiveKit on first unmute
- Auto-disconnect after 30s all-muted (via callback)

---

## Phase 7: Update Room Hook

### Modify `nooke/hooks/useRoom.ts`

Update `toggleMute()`:
```typescript
const toggleMute = async () => {
  const willBeUnmuted = participant.is_muted;

  if (willBeUnmuted) {
    // Connect to audio first
    const success = await unmuteAudio();
    if (!success) return; // Don't update DB if audio failed
  } else {
    await muteAudio();
  }

  // Then update database
  await supabase.from('room_participants')
    .update({ is_muted: !participant.is_muted })
    .eq('room_id', currentRoom.id)
    .eq('user_id', currentUser.id);
};
```

Update `leaveRoom()`:
- Call `disconnectAudio()` before leaving

Return new values:
- `isAudioConnected`, `isAudioConnecting`, `audioConnectionStatus`, `isParticipantSpeaking`

---

## Phase 8: UI Components

### Create `nooke/components/MuteButton.tsx`
- Large circular button with mic icon
- Shows `mic-off` when muted, `mic` when unmuted
- Loading spinner when connecting
- Green glow effect when unmuted
- Haptic feedback on press

### Create `nooke/components/AudioConnectionBadge.tsx`
- Small badge showing: "Audio Active", "Connecting...", "Reconnecting...", "Connection Error"
- Color-coded by status

### Create `nooke/components/SpeakingIndicator.tsx`
- Pulsing ring animation around avatar
- Shows when participant is speaking

---

## Phase 9: Update Room Screen

### Modify `nooke/app/(main)/room/[id].tsx`
- Add `MuteButton` at bottom center
- Add `AudioConnectionBadge` below header when connected/connecting
- Pass `isParticipantSpeaking` to RoomView for visual feedback

---

## Phase 10: App Initialization

### Update `nooke/app/_layout.tsx`
```typescript
import { initializeLiveKit } from '../lib/livekit';

useEffect(() => {
  initializeLiveKit();
}, []);
```

---

## Files to Create
| File | Purpose |
|------|---------|
| `nooke/lib/livekit.ts` | LiveKit client wrapper |
| `nooke/hooks/useAudio.ts` | Audio state management |
| `nooke/components/MuteButton.tsx` | Mute toggle button |
| `nooke/components/AudioConnectionBadge.tsx` | Connection status indicator |
| `nooke/components/SpeakingIndicator.tsx` | Speaking animation |
| `supabase/functions/livekit-token/index.ts` | Token generation |

## Files to Modify
| File | Changes |
|------|---------|
| `nooke/types/index.ts` | Add audio types |
| `nooke/stores/appStore.ts` | Add audio state |
| `nooke/hooks/useRoom.ts` | Integrate audio with toggleMute |
| `nooke/app/(main)/room/[id].tsx` | Add audio UI |
| `nooke/app/_layout.tsx` | Initialize LiveKit |
| `nooke/app.config.js` | Add LiveKit plugin |

---

## Verification Steps

1. **Package Installation**
   - Run `npx expo prebuild` to generate native projects
   - Build development client (won't work in Expo Go)

2. **Edge Function**
   - Deploy with `supabase functions deploy livekit-token`
   - Test token generation via curl

3. **Audio Flow**
   - [ ] Enter room (presence only, no audio)
   - [ ] Tap unmute → microphone permission prompt
   - [ ] Audio connects, badge shows "Audio Active"
   - [ ] Speaking indicator appears when talking
   - [ ] Other participants can hear you
   - [ ] Tap mute → mic disabled but still connected
   - [ ] All participants mute for 30s → auto-disconnect
   - [ ] Leave room → audio disconnects cleanly

4. **Error Handling**
   - [ ] Deny microphone permission → shows alert
   - [ ] Network disconnect → shows "Reconnecting..."
   - [ ] Token failure → shows error badge

---

## Notes

- **Requires development build** - LiveKit native modules won't work in Expo Go
- **iOS Info.plist** - Plugin should add `NSMicrophoneUsageDescription` automatically
- **Database already ready** - `rooms.audio_active` and `room_participants.is_muted` fields exist
