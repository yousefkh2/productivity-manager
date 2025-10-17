PRAGMA foreign_keys = ON;


CREATE TABLE IF NOT EXISTS day (
id INTEGER PRIMARY KEY,
date TEXT NOT NULL UNIQUE, -- YYYY‑MM‑DD local date
target_pomos INTEGER NOT NULL,
finished_pomos INTEGER NOT NULL DEFAULT 0,
start_time TEXT, -- ISO local
end_time TEXT, -- ISO local
comment TEXT,
-- End of day reflection fields
day_rating INTEGER CHECK(day_rating BETWEEN 1 AND 5), -- 1-5 stars
main_distraction TEXT, -- What got in the way
reflection_notes TEXT -- Additional thoughts
);


CREATE TABLE IF NOT EXISTS pomo (
id INTEGER PRIMARY KEY,
day_id INTEGER NOT NULL REFERENCES day(id) ON DELETE CASCADE,
start_time TEXT NOT NULL,
end_time TEXT,
duration_sec INTEGER NOT NULL,
aborted INTEGER NOT NULL DEFAULT 0, -- 0/1
focus_score INTEGER CHECK(focus_score BETWEEN 1 AND 5),
reason TEXT, -- "interruption", "music helped", etc.
note TEXT,
task TEXT NOT NULL,
context_switch INTEGER NOT NULL DEFAULT 0 -- 0/1
);


CREATE TABLE IF NOT EXISTS settings (
key TEXT PRIMARY KEY,
value TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS daily_tasks (
id INTEGER PRIMARY KEY,
day_id INTEGER NOT NULL REFERENCES day(id) ON DELETE CASCADE,
task_name TEXT NOT NULL,

-- PLANNING phase (set during daily intent ritual)
planned_pomodoros INTEGER DEFAULT 0,    -- How many you INTENDED to spend
planned_at TEXT,                         -- When you planned this task
plan_priority INTEGER,                   -- Priority order during planning (1st, 2nd, 3rd...)

-- EXECUTION phase (updated during actual work)
pomodoros_spent INTEGER NOT NULL DEFAULT 0,  -- How many you ACTUALLY spent
completed INTEGER NOT NULL DEFAULT 0,         -- 0/1 - Did you finish it?

-- METADATA for tracking and analysis
created_at TEXT NOT NULL,
completed_at TEXT,
added_mid_day INTEGER DEFAULT 0,        -- 0 = planned during ritual, 1 = added reactively
reason_added TEXT,                       -- "urgent bug", "new request", "forgot to plan", etc.

UNIQUE(day_id, task_name)
);


CREATE TABLE IF NOT EXISTS event_log (
id INTEGER PRIMARY KEY,
ts TEXT NOT NULL, -- ISO local
level TEXT NOT NULL, -- info/warn/error
event TEXT NOT NULL, -- e.g., "force_quit_detected"
metadata TEXT -- JSON blob
);


-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_pomo_day ON pomo(day_id);
CREATE INDEX IF NOT EXISTS idx_pomo_start ON pomo(start_time);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_day ON daily_tasks(day_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_planning ON daily_tasks(day_id, planned_at, added_mid_day);


CREATE VIEW IF NOT EXISTS v_day_summary AS
SELECT d.date,
d.target_pomos,
d.finished_pomos,
SUM(p.aborted) AS aborted_count,
ROUND(AVG(NULLIF(p.focus_score, 0)), 2) AS avg_focus
FROM day d LEFT JOIN pomo p ON p.day_id = d.id
GROUP BY d.id;