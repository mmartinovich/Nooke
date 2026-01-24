# Light/Dark Theme Migration Status

## Current Status: Core Screens Complete ✅

The theme infrastructure and all core screens have been successfully migrated! Users can now toggle between Light, Dark, and System themes in Settings.

---

## ✅ Completed (7 files)

### Theme Infrastructure
- ✅ `nooke/lib/theme.ts` - Restructured for dual themes with getTheme() function
- ✅ `nooke/stores/appStore.ts` - Added theme state with AsyncStorage persistence
- ✅ `nooke/context/ThemeContext.tsx` - Created theme provider
- ✅ `nooke/hooks/useTheme.ts` - Export useTheme hook
- ✅ `nooke/app/_layout.tsx` - Wrapped app with ThemeProvider

### Screens
- ✅ `nooke/app/(main)/settings.tsx` - Theme toggle UI with glassmorphism design
- ✅ `nooke/app/(main)/index.tsx` - Main home screen
- ✅ `nooke/app/(main)/friends.tsx` - Friends list
- ✅ `nooke/app/(main)/rooms.tsx` - Rooms list
- ✅ `nooke/app/(main)/_layout.tsx` - Navigation layout with dynamic header colors
- ✅ `nooke/app/(main)/safety.tsx` - Safety settings
- ✅ `nooke/app/(main)/room/[id].tsx` - Room detail view

---

## 🚧 Remaining Work (19 files)

### Priority 1: Auth & Profile Screens (2 files)
1. **`app/(auth)/login.tsx`** - Started migration (added useTheme hook)
   - Need to: Replace all color/gradient references in JSX and StyleSheet
   - Orb colors, text colors, button backgrounds, input styles

2. **`app/(main)/profile.tsx`** - Not started
   - Currently uses light theme - needs full redesign for dark mode compatibility

### Priority 2: Modal Components (7 files)
3. **`components/MoodPicker.tsx`**
   - Has BlurView (line 56) - needs tint update
   - Replace colors, gradients

4. **`components/CreateRoomModal.tsx`**
   - Replace colors in modal, inputs, buttons

5. **`components/RoomSettingsModal.tsx`**
   - Replace colors/gradients in modal UI

6. **`components/InviteFriendsModal.tsx`**
   - Has 2x BlurView (lines 54, 57) - need tint updates
   - Replace colors in friend list

7. **`components/RoomListModal.tsx`**
   - Replace colors in room cards

8. **`components/BlockModal.tsx`**
   - Replace colors + hardcoded #EF4444 red

9. **`components/ReportModal.tsx`**
   - Replace colors in form elements

### Priority 3: Card/UI Components (7 files)
10. **`components/RoomCard.tsx`**
    - Has BlurView (line 28) - needs tint update
    - Replace colors, gradients, border colors

11. **`components/InviteCard.tsx`**
    - Has BlurView (line 74) - needs tint update
    - Replace colors in card, buttons

12. **`components/CentralOrb.tsx`**
    - Has 2x BlurView (lines 104-105) - need tint updates
    - Replace gradients for orb glow

13. **`components/FriendOrb.tsx`**
    - Replace colors for mini orb display

14. **`components/FlareButton.tsx`**
    - Replace colors + hardcoded reds

15. **`components/VisibilityPicker.tsx`**
    - Replace colors in picker options

16. **`components/FriendActionBubble.tsx`**
    - Replace hardcoded colors in action menu

### Priority 4: Visual Effects (3 files)
17. **`components/RoomView.tsx`**
    - Replace colors/gradients in 3D room view

18. **`components/ParticleSphere.tsx`**
    - Replace colors + hardcoded gradients for particles

19. **`components/StarField.tsx`**
    - May need to hide in light mode (stars not visible on light bg)
    - Or use dark stars for light mode

---

## Migration Pattern

For each remaining file:

```typescript
// 1. Add import
import { useTheme } from '../hooks/useTheme';

// 2. Add hook in component
const { theme, isDark } = useTheme();

// 3. Replace static imports
// REMOVE: import { colors, gradients } from '../lib/theme';
// KEEP: import { spacing, radius, typography } from '../lib/theme';

// 4. Update JSX
// Before:
<View style={{ backgroundColor: colors.bg.primary }}>
<LinearGradient colors={gradients.neonCyan} />
<BlurView tint="dark" intensity={20} />

// After:
<View style={{ backgroundColor: theme.colors.bg.primary }}>
<LinearGradient colors={theme.gradients.neonCyan} />
<BlurView tint={theme.colors.blurTint} intensity={isDark ? 20 : 10} />

// 5. Update StyleSheet (remove static colors, use inline styles)
// Before:
const styles = StyleSheet.create({
  text: { color: colors.text.primary }
});

// After:
const styles = StyleSheet.create({
  text: { /* no color here */ }
});
// In JSX: <Text style={[styles.text, { color: theme.colors.text.primary }]} />
```

---

## Key Points

### Light Mode Colors
- `bg.primary`: `#F8F6FF` (soft lavender)
- `text.primary`: `#1a1a2e` (dark)
- `text.accent`: `#7c3aed` (purple)
- `glass.background`: `rgba(0,0,0,0.04)` (subtle dark tint)
- `blurTint`: `"light"`

### BlurView Intensity
- Dark mode: 20-25
- Light mode: 10-15

### Don't Change
- Mood colors (good, neutral, notGreat, reachOut) - work in both themes
- Spacing, radius, typography - theme-independent

---

## Testing Checklist (After All Files Migrated)

- [ ] Theme toggle works in Settings
- [ ] Theme persists across app restarts
- [ ] System theme detection works (changing device theme updates app)
- [ ] All screens render correctly in Light mode
- [ ] All screens render correctly in Dark mode
- [ ] BlurView glassmorphism looks appropriate in both modes
- [ ] StatusBar updates (light-content for dark, dark-content for light)
- [ ] No flash of wrong theme on app launch
- [ ] Text is readable in both themes
- [ ] Buttons/interactive elements are visible in both themes

---

## Quick Resume Instructions

When you continue:
1. Start with `app/(auth)/login.tsx` (partially migrated)
2. Then `app/(main)/profile.tsx`
3. Then work through modals and components in priority order
4. Test each file in both Light and Dark modes as you go
5. Run final testing checklist when all files complete
