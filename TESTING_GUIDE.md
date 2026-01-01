# Nooke App - Complete Testing Guide

## Pre-Testing Setup

### 1. Deploy Supabase Database (Required!)

**⚠️ CRITICAL:** You must complete these steps before testing the app.

Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) or use the quick steps below:

#### Step 1: Run Database Migration
1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/sql/new
2. Open `nooke/supabase/migrations/001_initial_schema.sql`
3. Copy ALL the SQL code
4. Paste into Supabase SQL Editor
5. Click **Run**
6. Verify "Success" message

#### Step 2: Enable Phone Auth
1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/auth/providers
2. Toggle **Phone** provider ON
3. Click **Save**

#### Step 3: Enable Realtime
1. Go to: https://supabase.com/dashboard/project/ezbamrqoewrbvdvbypyd/database/replication
2. Enable realtime for:
   - ✅ users
   - ✅ friendships
   - ✅ room_participants
   - ✅ flares

---

## 🚀 Starting the App

```bash
cd /Users/crax/DEVELOPMENT/Nooke/nooke
npx expo start
```

**Options:**
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR with Expo Go app on your phone

---

## 🧪 Feature Testing Checklist

### Test 1: Authentication Flow

**Goal:** Verify phone OTP login works

1. **Launch app**
   - Should show login screen with orb animation
   - Should see "Nooke" title and subtitle

2. **Enter phone number**
   - Format: `+1234567890` (include country code)
   - Click "Continue"
   - Should navigate to verify screen

3. **Verify OTP**
   - Check phone for SMS code
   - Enter 6-digit code
   - Should navigate to Orbit View (home)

4. **Verify session persistence**
   - Close app completely
   - Reopen app
   - Should go directly to Orbit View (still logged in)

**Expected Result:** ✅ Successful login and session persistence

---

### Test 2: Mood Status

**Goal:** Change mood and verify it updates

1. **Open Mood Picker**
   - On Orbit View, tap "Change" button in mood card
   - Modal should open with 4 mood options

2. **Select a mood**
   - Tap "Feeling good" (green orb)
   - Modal should close
   - Mood card should update to show green orb

3. **Change mood again**
   - Tap "Change" again
   - Select "Need support" (purple orb)
   - Should update immediately

4. **Verify persistence**
   - Pull down to refresh Orbit View
   - Mood should still be "Need support"

**Expected Result:** ✅ Mood changes instantly and persists

---

### Test 3: Friend Request System

**Goal:** Add a friend and verify two-way friendship

**Setup:** You need 2 phone numbers/accounts for this test

**On Account 1:**
1. Tap "Friends" button at bottom
2. Enter Account 2's phone number (e.g., `+1234567891`)
3. Click "Send Request"
4. Should show success alert

**On Account 2:**
1. Login with Account 2
2. Tap "Friends" button
3. Should see "Pending Requests (1)"
4. See Account 1's request with Accept/Decline buttons
5. Tap "Accept"

**On Both Accounts:**
- Pull to refresh Friends screen
- Both should now see each other in "Friends" list
- Go back to Orbit View
- Should see friend's orb appear

**Expected Result:** ✅ Bidirectional friendship established

---

### Test 4: Real-Time Presence

**Goal:** Verify friend's status updates in real-time

**Setup:** 2 devices with established friendship

**On Account 1:**
1. View Orbit screen
2. Observe friend's orb

**On Account 2:**
1. Change mood to "Not great" (gray)
2. Wait 2-3 seconds

**On Account 1:**
- Friend's orb should change to gray WITHOUT refreshing
- Should happen automatically via realtime

**Test Online/Offline:**
- Close app completely on Account 2
- Wait 5 seconds
- On Account 1: friend's orb should become dimmer (offline state)

**Expected Result:** ✅ Real-time updates without manual refresh

---

### Test 5: Nudge Feature with Rate Limiting

**Goal:** Send nudges and hit rate limit

**Setup:** 2 devices with established friendship

**On Account 1:**
1. Tap friend's orb in Orbit View
2. Alert should show friend's info
3. Tap "Send Nudge 👋"
4. Should show success alert
5. Should feel haptic vibration

**On Account 2:**
- Should receive push notification (if on physical device)
- Should feel gentle haptic vibration

**Test Rate Limit:**
**On Account 1:**
1. Send 2 more nudges to same friend (total: 3)
2. All 3 should succeed
3. Try sending 4th nudge
4. Should get "Limit Reached" error
5. Error should say "3 nudges per friend per day"

**Expected Result:** ✅ Nudges work, rate limit enforced at 3/day

---

### Test 6: Flare (SOS) Feature

**Goal:** Send a flare and verify friends see it

**Setup:** 2 devices with established friendship

**On Account 1:**
1. On Orbit View, tap "Send Flare" button
2. Confirmation alert should appear
3. Tap "Send Flare"
4. Should show success alert
5. Flare button should change to "Flare Active" (red, pulsing)
6. Should feel strong haptic feedback

**On Account 2:**
- Should see red alert banner at top of Orbit View
- Banner should say "🚨 1 friend needs support"
- Should show Account 1's name
- Should feel strong haptic vibration

**Test Flare Expiration:**
- Flare expires in 30 minutes
- Or manually delete from Supabase to test cleanup

**Test Duplicate Prevention:**
**On Account 1:**
1. While flare is active, try sending another
2. Should get "Flare Active" error
3. Should show remaining minutes

**Expected Result:** ✅ Flares send, appear to friends, prevent duplicates

---

### Test 7: Push Notifications

**Goal:** Verify notification registration

**⚠️ Note:** Must use physical device, not simulator

1. Login to app on physical device
2. Grant notification permissions when prompted
3. Check Supabase database:
   - Go to Table Editor → users
   - Find your user record
   - `fcm_token` field should have a value (long string)

**Expected Result:** ✅ Token saved to database

**Full push notification testing requires:**
- Backend service to send notifications (not yet implemented)
- Or use Expo's push notification tool: https://expo.dev/notifications

---

## 🐛 Troubleshooting

### "Relation users does not exist"
**Cause:** Database migration not run
**Fix:** Complete Step 1 of Pre-Testing Setup

### "Phone auth not enabled"
**Cause:** Phone provider not enabled in Supabase
**Fix:** Complete Step 2 of Pre-Testing Setup

### Friends list not updating in real-time
**Cause:** Realtime not enabled for tables
**Fix:** Complete Step 3 of Pre-Testing Setup

### Can't send OTP / "Failed to send code"
**Causes:**
- Phone number format wrong (need `+` prefix)
- Phone provider not enabled
- Supabase project issue

**Fix:**
1. Check phone format: `+1234567890`
2. Verify phone auth is enabled
3. Check Supabase logs for errors

### Nudge rate limit not working
**Cause:** Database trigger not created
**Fix:** Re-run database migration (it includes the trigger)

### Flare not appearing for friends
**Causes:**
- Realtime not enabled for `flares` table
- Not actually friends (check friendships table)

**Fix:**
- Enable realtime for `flares` table
- Verify friendship exists in database

### Push notifications not working
**Causes:**
- Using simulator (doesn't support notifications)
- Permissions denied
- Physical device required

**Fix:**
- Test on physical device
- Grant permissions when prompted
- Check device settings

---

## 📊 Database Verification

You can verify data in Supabase Table Editor:

### Check Users
```
Table: users
Verify: Your user exists, has mood, is_online = true
```

### Check Friendships
```
Table: friendships
Verify: Two records exist (one each direction)
Status: accepted
```

### Check Nudges
```
Table: nudges
Verify: Records created when you send nudges
```

### Check Nudge Limits
```
Table: nudge_limits
Verify: Count increments, max is 3
Resets daily
```

### Check Flares
```
Table: flares
Verify: Record exists when flare active
expires_at is 30 minutes in future
```

---

## 🎯 Success Criteria

You've successfully completed testing if:

- ✅ Login works with phone OTP
- ✅ Mood changes and shows to friends
- ✅ Can add friends and see them in Orbit
- ✅ Friend status updates in real-time
- ✅ Nudges work and rate limit at 3/day
- ✅ Flares send and appear to friends
- ✅ Push token registered in database

---

## 🚨 Critical Issues to Report

If any of these fail, please investigate:

1. **Login fails completely** - Check Supabase auth logs
2. **No real-time updates** - Check Realtime is enabled
3. **Rate limits don't work** - Check database triggers exist
4. **App crashes** - Check Metro console for errors

---

## 📱 Testing with Multiple Devices

**Best practice:** Test with 2 physical devices

**Alternative options:**
1. **iOS Simulator + Physical Phone**
   - Login to Account 1 on simulator
   - Login to Account 2 on phone
   - Test real-time features

2. **Android Emulator + Physical Phone**
   - Same as above

3. **Two Physical Phones** (ideal)
   - Full feature testing
   - Push notifications work
   - Haptics work
   - Most realistic user experience

---

## 🎉 Next Steps After Testing

Once all tests pass:

1. **Phase 3 Planning**
   - Voice rooms with LiveKit
   - Two-layer audio system
   - Room management UI

2. **Polish & Improvements**
   - Better error messages
   - Loading states
   - Animations
   - Accessibility

3. **Production Prep**
   - App icons
   - Splash screens
   - Privacy policy
   - Terms of service
   - App Store listing

---

**Questions?** Check the main docs:
- [QUICK_START.md](nooke/QUICK_START.md)
- [PHASE_1_2_COMPLETE.md](PHASE_1_2_COMPLETE.md)
- [CURSOR_BUILD_PLAN.md](CURSOR_BUILD_PLAN.md)

**Happy Testing! 🚀**
