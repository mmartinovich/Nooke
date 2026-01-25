-- Migration: Fix RLS Security Gaps and Add Performance Indexes
-- Date: 2026-01-25
-- Description: Addresses security gaps in RLS policies and adds missing indexes

-- ============================================
-- 1. Fix room_participants SELECT policy (security gap)
-- Currently allows anyone to see all participants
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view room participants" ON room_participants;

-- Create restrictive policy: Only view participants in rooms you're also in
CREATE POLICY "Users can view room participants in their rooms"
  ON room_participants FOR SELECT
  USING (
    room_id IN (
      SELECT rp.room_id 
      FROM room_participants rp 
      WHERE rp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM rooms r 
      WHERE r.id = room_participants.room_id 
      AND r.creator_id = auth.uid()
    )
  );

-- ============================================
-- 2. Add flares UPDATE policy for responded_by
-- ============================================

-- Allow users to update responded_by on flares (to mark they responded)
DROP POLICY IF EXISTS "Users can respond to flares" ON flares;

CREATE POLICY "Users can respond to flares"
  ON flares FOR UPDATE
  USING (
    -- Can only update flares from friends (not your own)
    user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.user_id = auth.uid()
      AND f.friend_id = flares.user_id
      AND f.status = 'accepted'
    )
  )
  WITH CHECK (
    -- Can only set responded_by to yourself
    responded_by = auth.uid()
  );

-- ============================================
-- 3. Add missing composite indexes for performance
-- ============================================

-- Friendships: user_id + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_friendships_user_status 
  ON friendships(user_id, status);

-- Room participants: room_id + user_id (existence checks)
CREATE INDEX IF NOT EXISTS idx_room_participants_room_user 
  ON room_participants(room_id, user_id);

-- Flares: user_id + expires_at (active flare queries)
CREATE INDEX IF NOT EXISTS idx_flares_user_expires 
  ON flares(user_id, expires_at);

-- Partial index for accepted friendships (most common query)
CREATE INDEX IF NOT EXISTS idx_friendships_accepted 
  ON friendships(user_id, friend_id) 
  WHERE status = 'accepted';

-- Blocks: blocker_id (for filtering friends)
CREATE INDEX IF NOT EXISTS idx_blocks_blocker 
  ON blocks(blocker_id);

-- Notifications: user_id + created_at (list queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
  ON notifications(user_id, created_at DESC);

-- Users: is_online (presence queries)
CREATE INDEX IF NOT EXISTS idx_users_online 
  ON users(is_online) 
  WHERE is_online = true;

-- Room invites: receiver_id + status (pending invites)
CREATE INDEX IF NOT EXISTS idx_room_invites_receiver_status 
  ON room_invites(receiver_id, status);

-- ============================================
-- 4. Add comments for documentation
-- ============================================

COMMENT ON INDEX idx_friendships_user_status IS 'Optimizes friend list queries filtered by status';
COMMENT ON INDEX idx_room_participants_room_user IS 'Optimizes room membership checks';
COMMENT ON INDEX idx_flares_user_expires IS 'Optimizes active flare queries';
COMMENT ON INDEX idx_friendships_accepted IS 'Partial index for accepted friendships only';
COMMENT ON INDEX idx_blocks_blocker IS 'Optimizes block filtering when loading friends';
COMMENT ON INDEX idx_notifications_user_created IS 'Optimizes notification list queries';
COMMENT ON INDEX idx_users_online IS 'Partial index for online users only';
COMMENT ON INDEX idx_room_invites_receiver_status IS 'Optimizes pending invite queries';
