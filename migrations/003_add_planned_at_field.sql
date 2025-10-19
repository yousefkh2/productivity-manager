-- Migration: Add planned_at field to day table
-- Date: 2025-10-19
-- Purpose: Store when the day was planned to calculate accurate progress and finish time

ALTER TABLE day ADD COLUMN planned_at TIMESTAMP;
