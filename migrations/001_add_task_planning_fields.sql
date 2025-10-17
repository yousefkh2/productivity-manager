-- Migration: Add planning vs. execution tracking fields to daily_tasks
-- Date: 2025-10-17
-- Purpose: Enable Wolfram-grade intention vs. execution analysis

-- Add planning fields
ALTER TABLE daily_tasks ADD COLUMN planned_pomodoros INTEGER DEFAULT 0;
ALTER TABLE daily_tasks ADD COLUMN planned_at TEXT;
ALTER TABLE daily_tasks ADD COLUMN plan_priority INTEGER;

-- Add execution metadata
ALTER TABLE daily_tasks ADD COLUMN added_mid_day INTEGER DEFAULT 0;
ALTER TABLE daily_tasks ADD COLUMN reason_added TEXT;

-- For existing rows, set sensible defaults
-- If task has pomodoros_spent > 0, assume it was planned (not added mid-day)
UPDATE daily_tasks 
SET planned_pomodoros = pomodoros_spent,
    planned_at = created_at,
    added_mid_day = 0
WHERE planned_pomodoros = 0;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_daily_tasks_planning ON daily_tasks(day_id, planned_at, added_mid_day);
