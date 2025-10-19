-- Migration: Add reward field to day table
-- Date: 2025-10-19
-- Purpose: Allow users to set a reward for completing their daily pomodoro target

ALTER TABLE day ADD COLUMN reward TEXT DEFAULT '';
