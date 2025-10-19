# Reward System Feature

## Overview
The reward system adds positive motivation by allowing users to set a guilt-free reward they'll enjoy after completing their planned pomodoros. This creates a psychological contract with yourself and makes the day feel more engaging.

## Implementation

### Planning Flow (3 Steps)

#### Step 1: Set Pomodoros
- User selects how many pomodoros they plan to complete
- Shows estimated finish time
- Quick select buttons: 4, 8, 12, 16

#### Step 2: Plan Tasks
- User adds tasks with estimated pomodoros
- Shows total vs. target warning if exceeded
- Can skip if no specific tasks planned

#### Step 3: Set Reward (NEW!)
- User enters what they'll enjoy guilt-free after completion
- **Prompt**: "What's something you'll enjoy guilt-free once you finish your pomodoros?"
- Placeholder examples:
  - "Watch one episode of Dark 🍿"
  - "Read Atomic Habits for 30 min 📖"
  - "Take a long walk with music 🎧"
  - "Call my friend ☎️"
- Quick idea buttons for inspiration
- Shows unlock message: "You'll unlock this once you hit X pomodoros."

### Display

#### Today's Plan Banner
When a reward is set, it appears below the progress bars with:
- 🎁 Gift icon in green circular background
- "Your Reward" label
- The reward text
- Status indicator:
  - If completed: "🎉 Unlocked!" (green)
  - If in progress: "X more to go" (gray)

### Database Schema

```sql
ALTER TABLE day ADD COLUMN reward TEXT DEFAULT '';
```

### Backend Changes

**Day struct** (`backend/main.go`):
```go
type Day struct {
    // ... existing fields
    Reward string `json:"reward"` // Reward for completing pomodoros
}
```

**INSERT statement**:
```go
INSERT INTO day (date, target_pomos, finished_pomos, start_time, comment, reward)
VALUES (?, ?, ?, ?, ?, ?)
```

**UPDATE statement**:
```go
UPDATE day 
SET target_pomos = ?, finished_pomos = ?, start_time = ?, end_time = ?, comment = ?, reward = ?
WHERE id = ?
```

**SELECT statement**:
```go
SELECT id, date, target_pomos, finished_pomos, start_time, end_time, 
       comment, day_rating, main_distraction, reflection_notes, reward
FROM day WHERE date = ?
```

### Frontend Changes

**DailyIntent.jsx**:
- Added Step 3 with reward input
- Gift icon from lucide-react
- Textarea with examples
- Quick idea buttons
- Unlock message with pomodoro target

**App.jsx**:
- Import Gift icon
- Pass reward when saving daily intent
- Display reward in Today's Plan banner
- Show unlock status based on completed pomodoros

## User Experience

### Flow
1. User plans their day (Step 1: Pomodoros, Step 2: Tasks)
2. User sets reward (Step 3)
3. Reward appears in Today's Plan banner
4. As user completes pomodoros, status updates ("X more to go")
5. When target is reached: "🎉 Unlocked!"
6. User enjoys their reward guilt-free

### Psychology
- **Positive reinforcement**: External motivation to complete target
- **Specificity**: Asking for specific reward makes it more compelling
- **Guilt-free framing**: Permission to enjoy the reward after work
- **Progress tracking**: Seeing "X more to go" creates urgency
- **Celebration**: "🎉 Unlocked!" provides dopamine hit

### Examples of Good Rewards
- ✅ "Watch one episode of Dark" (specific, time-boxed)
- ✅ "Read for 30 minutes" (specific duration)
- ✅ "Long walk with music" (clear activity)
- ✅ "Call my friend Sarah" (specific person/action)
- ❌ "Relax" (too vague)
- ❌ "Do nothing" (not motivating)

## Future Enhancements

Potential improvements:
- [ ] Reward history view (see past rewards and if they were earned)
- [ ] Reward suggestions based on time of day
- [ ] Streak bonus: unlock extra reward for X days in a row
- [ ] Share reward unlock on social media
- [ ] Reward templates/presets
- [ ] Celebration animation when reward is unlocked
- [ ] Integration with habit trackers

## Migration

To apply the database change:
```bash
sqlite3 backend/hardmode.db < migrations/002_add_reward_field.sql
```

Or manually:
```bash
sqlite3 backend/hardmode.db "ALTER TABLE day ADD COLUMN reward TEXT DEFAULT '';"
```

## Testing

To test the feature:
1. Start planning your day
2. Set a pomodoro target (e.g., 8)
3. Add some tasks
4. In Step 3, enter a reward (e.g., "Watch The Office 🍿")
5. Check that reward appears in Today's Plan banner
6. Complete some pomodoros and verify the counter updates
7. Complete all pomodoros and verify "🎉 Unlocked!" appears
