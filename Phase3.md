# Phase 3 Completion Plan

## Scope

Complete the remaining Phase 3 features:
1. Ghost Mode enforcement (presence suppression)
2. Take a Break enforcement (presence + nudge/flare suppression)
3. Hard Block enforcement (remove friendship, filter from queries)
4. Profile Editing (display name + avatar upload)

Anchors and Reporting are already functional (UI + hooks + DB) — no changes needed.

---

## Step 1: Update `useSafety.ts` — Sync store on ghost/break toggle

After writing `ghost_mode_until` or `take_break_until` to the DB, also update `currentUser` in Zustand store so other hooks can react.

**File:** `nuuky/hooks/useSafety.ts`
- In `enableGhostMode`: call `setCurrentUser({ ...currentUser, ghost_mode_until: timestamp })`
- In `disableGhostMode`: call `setCurrentUser({ ...currentUser, ghost_mode_until: undefined })`
- In `takeBreak`: call `setCurrentUser({ ...currentUser, take_break_until: timestamp })`
- In `endBreak`: call `setCurrentUser({ ...currentUser, take_break_until: undefined })`

---

## Step 2: Ghost Mode + Break Mode enforcement in `usePresence.ts`

**File:** `nuuky/hooks/usePresence.ts`

- In `updatePresence`, check if `currentUser.ghost_mode_until` or `currentUser.take_break_until` is in the future
- If either is active, force `is_online: false` regardless of actual app state
- Add a `useEffect` watching these fields — when they activate, immediately push `is_online: false`

---

## Step 3: Break Mode — Block nudge/flare sending

**Files:** `nuuky/hooks/useNudge.ts`, `nuuky/hooks/useFlare.ts`

- At the top of `sendNudge`, check if current user is on break → show alert, return false
- At the top of `sendFlare`, check if current user is on break → show alert, return false

---

## Step 4: Hard Block — Delete friendship on block

**File:** `nuuky/hooks/useSafety.ts`

- In `blockUser`, after inserting the block record, if `blockType === 'hard'`:
  - Delete friendships in both directions (user_id/friend_id swap)
  - Refresh friends list

---

## Step 5: Filter blocked users from friends query

**File:** `nuuky/hooks/useFriends.ts`

- In `loadFriends`, after fetching friendships, also fetch blocks where current user is blocker
- Filter out any friends whose ID appears in the blocked set

---

## Step 6: Supabase Storage migration for avatars

- Create `avatars` storage bucket (public)
- RLS policies: users can upload/update/delete their own folder, public read

---

## Step 7: Install `expo-image-picker`

**Command:** `npx expo install expo-image-picker`
**File:** `nuuky/app.config.js` — add plugin with permission strings

---

## Step 8: New hook `useProfile.ts`

**New file:** `nuuky/hooks/useProfile.ts`

Functions:
- `updateDisplayName(name)` — validates (1-50 chars), updates DB + store
- `pickAndUploadAvatar(source: 'camera' | 'gallery')` — picks image, uploads to Supabase Storage, updates `avatar_url` in DB + store

---

## Step 9: Rewrite `profile.tsx` with edit UI

**File:** `nuuky/app/(main)/profile.tsx`

- Theme-integrated UI (LinearGradient, BlurView, themed colors)
- Avatar: circular image (120px) with camera overlay button → ActionSheet (Camera/Gallery)
- Display name: tap pencil to edit inline, save/cancel buttons
- Keep logout button, themed

---

## Verification

1. Toggle Ghost Mode on → confirm user appears offline to friends
2. Toggle Take a Break → confirm nudge/flare buttons show alert and don't send
3. Hard block a friend → confirm friendship deleted, friend disappears from list
4. Edit display name → confirm persists after app reload
5. Upload avatar from gallery/camera → confirm image appears in profile and friend views
