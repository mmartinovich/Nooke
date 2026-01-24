# Nūūky App - Cursor Implementation Plan

## Project Overview
**App Name:** Nūūky (ambient presence app for close friends)  
**Core Concept:** Feel connected without the pressure of communicating  
**Tech Stack:** React Native (Expo), Supabase, LiveKit/Agora

---

## Quick Start Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Initialize Expo project with TypeScript
- [ ] Set up Supabase project (database, auth, realtime)
- [ ] Implement phone OTP authentication
- [ ] Create all database tables (see schema below)
- [ ] Build basic navigation structure
- [ ] Implement friend request flow

### Phase 2: Core Features (Week 3-4)
- [ ] Build Orbit View with friend dots visualization
- [ ] Implement real-time presence with Supabase Realtime
- [ ] Add mood status feature
- [ ] Implement nudge with haptic feedback + rate limits
- [ ] Build flare feature with push notifications
- [ ] Set up Firebase Cloud Messaging

### Phase 3: Rooms + Safety (Week 5-6)
- [ ] Integrate LiveKit or Agora for audio
- [ ] Build room creation and joining flow
- [ ] Implement two-layer audio optimization
- [ ] Build complete safety system (blocks, ghost mode, reporting)
- [ ] Implement visibility tiers per friend
- [ ] Add anchor system

### Phase 4: Polish (Week 7-8)
- [ ] UI/UX polish and animations
- [ ] Error handling and edge cases
- [ ] Onboarding flow
- [ ] Performance optimization
- [ ] Beta testing
- [ ] App Store / Play Store prep

---

## Tech Stack

### Frontend
- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Navigation:** Expo Router
- **State Management:** Zustand
- **UI Library:** NativeWind (Tailwind for RN)

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (phone OTP)
- **Realtime:** Supabase Realtime
- **Storage:** Supabase Storage (avatars)

### Audio
- **Option A:** LiveKit (recommended, better optimization)
- **Option B:** Agora (easier to start)

### Notifications
- **Push:** Firebase Cloud Messaging (FCM)
- **Haptics:** Expo Haptics

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  mood VARCHAR(20) DEFAULT 'neutral',
  is_online BOOLEAN DEFAULT false,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  ghost_mode_until TIMESTAMPTZ,
  take_break_until TIMESTAMPTZ,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Friendships with visibility control
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  visibility VARCHAR(20) DEFAULT 'full',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_interaction_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Rooms & Participants
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_private BOOLEAN DEFAULT false,
  audio_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Flares (SOS signals)
CREATE TABLE flares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  responded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Nudges
CREATE TABLE nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rate limiting for nudges
CREATE TABLE nudge_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  date DATE DEFAULT CURRENT_DATE,
  count INT DEFAULT 0,
  UNIQUE(sender_id, receiver_id, date)
);

-- Blocks (silent, user never knows)
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(id) ON DELETE CASCADE,
  block_type VARCHAR(20) DEFAULT 'hard',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id),
  reported_id UUID REFERENCES users(id),
  report_type VARCHAR(50),
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anchors (trusted safety contacts)
CREATE TABLE anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anchor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, anchor_id)
);
```

---

## Project File Structure

```
nooke/
├── app/                          # Expo Router
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── verify.tsx
│   ├── (main)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Orbit view
│   │   ├── room/[id].tsx
│   │   ├── profile.tsx
│   │   ├── settings.tsx
│   │   └── safety.tsx
│   └── _layout.tsx
├── components/
│   ├── OrbitView.tsx
│   ├── FriendDot.tsx
│   ├── RoomView.tsx
│   ├── MoodPicker.tsx
│   ├── FlareButton.tsx
│   ├── NudgeAnimation.tsx
│   ├── BlockModal.tsx
│   └── PrivacyControls.tsx
├── lib/
│   ├── supabase.ts
│   ├── audio.ts
│   ├── presence.ts
│   ├── notifications.ts
│   ├── haptics.ts
│   └── safety.ts
├── hooks/
│   ├── usePresence.ts
│   ├── useRoom.ts
│   ├── useFriends.ts
│   ├── useAuth.ts
│   └── useSafety.ts
├── stores/
│   └── appStore.ts
├── types/
│   └── index.ts
└── package.json
```

---

## API Endpoints

```typescript
// Authentication
POST /auth/send-otp         { phone }
POST /auth/verify-otp       { phone, code } → { user, token }
POST /auth/logout

// Friends
GET  /friends                → { friends[] }
POST /friends/request        { phone }
POST /friends/accept/:id
DELETE /friends/:id

// Presence & Mood
PUT  /users/me/mood          { mood }
// Presence via Supabase Realtime

// Nudges & Flares
POST /nudge                  { friend_id }
POST /flare
GET  /flare/active           → { flares[] }

// Rooms
POST /rooms                  { name?, is_private? }
GET  /rooms/active           → { rooms[] }
POST /rooms/:id/join         → { room, audioToken? }
POST /rooms/:id/leave
PUT  /rooms/:id/mute         { is_muted }
DELETE /rooms/:id

// Safety
POST /block                  { user_id, block_type }
DELETE /block/:user_id
POST /report                 { user_id, report_type, details }
PUT  /users/me/visibility/:friend_id  { visibility }
POST /users/me/ghost-mode    { duration }
POST /users/me/take-break    { duration }
```

---

## Key Features Specification

### 1. Orbit View (Home Screen)
- All friends displayed as glowing dots in a circle
- Online friends: brighter glow + subtle pulse animation
- Mood indicated by dot color:
  - Green #4ade80: Feeling good
  - Yellow #facc15: Neutral
  - Gray #9ca3af: Not great
  - Purple #a855f7: Reach out
- Tap friend's dot for options (nudge, view profile)

### 2. Nudge
- Tap and hold friend's dot to send
- Receiver gets gentle haptic feedback
- **Rate limit: max 3 per friend per day**
- Subtle animation shows nudge was received

### 3. Mood Status
- Simple 4-option picker
- Visible to all friends
- Can change anytime

### 4. Flare (SOS)
- One button to send to all friends
- **Rate limit: 1 per 24 hours**
- Auto-expires after 30 minutes
- Anchors get stronger notification

### 5. Open Room
- Drop-in voice rooms (no "calling")
- Enter muted by default
- Leave anytime, no awkwardness
- **CRITICAL:** Audio only connects when someone unmutes
- Auto-disconnect after 30s of silence (cost optimization)

---

## Two-Layer Audio System (CRITICAL)

**The Problem:** Keeping audio connections open 24/7 is expensive.

**The Solution:** Separate presence from audio.

### Layer 1: Presence (Always On)
- Supabase Realtime
- Shows who's in room
- No audio connection
- Nearly free

### Layer 2: Audio (On-Demand)
- Only connect to LiveKit/Agora when someone unmutes
- Disconnect after 30s of all-muted
- Saves 80-95% on audio costs

### Implementation:
```typescript
// User enters room
await joinRoom(roomId) // Creates presence record, NO audio

// User unmutes
if (isFirstToUnmute) {
  await connectToAudioServer() // Now connect to LiveKit
}

// All users muted for 30s
setTimeout(() => {
  if (allMuted) {
    await disconnectFromAudioServer() // Drop connection
  }
}, 30000)
```

---

## Safety Features (NON-NEGOTIABLE)

### Block Options (All Silent)
- **Mute:** Don't see their presence
- **Soft Block:** They see you as always offline
- **Hard Block:** Full removal
- **Ghost Mode:** Disappear from everyone temporarily

### Visibility Tiers (Per Friend)
- **Full:** See when I'm online, mood, rooms
- **Limited:** See online status only
- **Minimal:** Only see me if I interact first
- **Hidden:** I'm invisible to them

### Rate Limits
- Nudges: 3 per friend per day
- Flares: 1 per 24 hours
- Friend requests: 10 per day

### Anchor System
- Designate 1-2 trusted friends
- They see if you're inactive 48+ hours
- Get notified when you report someone
- Stronger flare notifications

---

## Initial Setup Commands

```bash
# Create Expo project
npx create-expo-app nooke --template blank-typescript

# Install core dependencies
npm install @supabase/supabase-js
npm install zustand
npm install expo-router
npm install nativewind
npm install expo-haptics
npm install @react-native-firebase/app
npm install @react-native-firebase/messaging

# Audio (choose one)
npm install @livekit/react-native  # Option A
npm install react-native-agora      # Option B

# Development
npm install -D tailwindcss
```

---

## Environment Variables (.env)

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_LIVEKIT_URL=your_livekit_url
FIREBASE_PROJECT_ID=your_firebase_project_id
```

---

## Success Metrics

- **DAU/MAU ratio:** >40% (daily habit)
- **Average session:** 2-5 minutes (quick check-ins)
- **Room join rate:** >20% weekly
- **Nudge reciprocation:** >60% within 24h
- **Flare response:** >80%
- **Week 1 retention:** >50%
- **Block rate:** <5% of friendships

---

## Critical Notes for Development

1. **Start with Supabase setup** - this unblocks everything
2. **Build presence layer before audio** - you can demo without voice
3. **Safety features are NOT optional** - build alongside core features
4. **Test haptics on real devices** - simulators don't work
5. **Two-layer audio is complex** - allocate extra time
6. **Push notifications require physical devices**
7. **Test block/report flows extensively**

---

## Cost Optimization Rules

### Audio Costs (CRITICAL)
- Only connect when someone unmutes
- Disconnect after 30s of silence
- This saves 80-95% on audio infrastructure

### Database
- Use Supabase Realtime for presence (included in free tier)
- Batch friend list queries
- Cache avatar images

### Storage
- Compress avatars to 200x200
- Use Supabase Storage CDN

---

## Next Steps

1. **Set up Supabase project** at supabase.com
2. **Run database migrations** (copy schema above)
3. **Initialize Expo project** with commands above
4. **Start with authentication flow** (phone OTP)
5. **Build Orbit View UI** (can be done without backend initially)
6. **Integrate presence** with Supabase Realtime
7. **Add features incrementally** following the phase plan

---

## Questions to Answer Before Building

- [ ] Which audio provider? (LiveKit recommended)
- [ ] Self-host or use cloud? (Cloud for MVP, self-host later)
- [ ] iOS, Android, or both? (Both with Expo)
- [ ] Target region/timezone? (affects presence logic)
- [ ] Beta testing group size? (aim for 20-50 users)

---

**Good luck building Nūūky! 🚀**

This is everything you need to give to Cursor to start building. Focus on Phase 1 first, then iterate.
