package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
	"github.com/rs/cors"
)

// Models
type Task struct {
	ID          int        `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at"`
	IsCompleted bool       `json:"is_completed"`
}

type Day struct {
	ID              int        `json:"id"`
	Date            string     `json:"date"` // YYYY-MM-DD
	TargetPomos     int        `json:"target_pomos"`
	FinishedPomos   int        `json:"finished_pomos"`
	StartTime       *time.Time `json:"start_time"`
	EndTime         *time.Time `json:"end_time"`
	Comment         string     `json:"comment"`
	DayRating       *int       `json:"day_rating"`       // 1-5 stars
	MainDistraction string     `json:"main_distraction"` // What got in the way
	ReflectionNotes string     `json:"reflection_notes"` // Additional thoughts
}

type DailyTask struct {
	ID               int        `json:"id"`
	DayID            int        `json:"day_id"`
	TaskName         string     `json:"task_name"`
	PlannedPomodoros int        `json:"planned_pomodoros"`
	PlannedAt        *time.Time `json:"planned_at"`
	PlanPriority     *int       `json:"plan_priority"`
	PomodorosSpent   int        `json:"pomodoros_spent"`
	Completed        bool       `json:"completed"`
	CreatedAt        time.Time  `json:"created_at"`
	CompletedAt      *time.Time `json:"completed_at"`
	AddedMidDay      bool       `json:"added_mid_day"`
	ReasonAdded      string     `json:"reason_added"`
}

type PomodoroSession struct {
	ID        int        `json:"id"`
	TaskID    int        `json:"task_id"`
	StartTime time.Time  `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
	Duration  int        `json:"duration"`
	Completed bool       `json:"completed"`
}

type PomodoroDetail struct {
	ID            int        `json:"id"`
	DayID         int        `json:"day_id"`
	StartTime     time.Time  `json:"start_time"`
	EndTime       *time.Time `json:"end_time"`
	DurationSec   int        `json:"duration_sec"`
	Aborted       bool       `json:"aborted"`
	FocusScore    *int       `json:"focus_score"` // 1-5
	Reason        string     `json:"reason"`      // "interruption", "music helped", etc.
	Note          string     `json:"note"`
	Task          string     `json:"task"`
	ContextSwitch bool       `json:"context_switch"`
	PauseCount    int        `json:"pause_count"` // Number of times paused during session
}

type Statistics struct {
	TotalSessions     int     `json:"total_sessions"`
	CompletedSessions int     `json:"completed_sessions"`
	TotalMinutes      int     `json:"total_minutes"`
	TasksCompleted    int     `json:"tasks_completed"`
	AverageFocusTime  float64 `json:"average_focus_time"`
}

// Database
var db *sql.DB

func initDB() error {
	var err error
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./hardmode.db"
	}

	db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		return err
	}

	// Test connection
	if err = db.Ping(); err != nil {
		return err
	}

	// Create tables
	schema := `
	CREATE TABLE IF NOT EXISTS tasks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		description TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		completed_at TIMESTAMP,
		is_completed BOOLEAN DEFAULT 0
	);

	CREATE TABLE IF NOT EXISTS day (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		date TEXT NOT NULL UNIQUE,
		target_pomos INTEGER NOT NULL,
		finished_pomos INTEGER NOT NULL DEFAULT 0,
		start_time TIMESTAMP,
		end_time TIMESTAMP,
		comment TEXT,
		day_rating INTEGER CHECK(day_rating BETWEEN 1 AND 5),
		main_distraction TEXT,
		reflection_notes TEXT
	);

	CREATE TABLE IF NOT EXISTS daily_tasks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		day_id INTEGER NOT NULL,
		task_name TEXT NOT NULL,
		planned_pomodoros INTEGER DEFAULT 0,
		planned_at TIMESTAMP,
		plan_priority INTEGER,
		pomodoros_spent INTEGER NOT NULL DEFAULT 0,
		completed BOOLEAN NOT NULL DEFAULT 0,
		created_at TIMESTAMP NOT NULL,
		completed_at TIMESTAMP,
		added_mid_day BOOLEAN DEFAULT 0,
		reason_added TEXT,
		FOREIGN KEY (day_id) REFERENCES day(id) ON DELETE CASCADE,
		UNIQUE(day_id, task_name)
	);

	CREATE TABLE IF NOT EXISTS pomo (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		day_id INTEGER NOT NULL,
		start_time TIMESTAMP NOT NULL,
		end_time TIMESTAMP,
		duration_sec INTEGER NOT NULL,
		aborted BOOLEAN NOT NULL DEFAULT 0,
		focus_score INTEGER CHECK(focus_score BETWEEN 1 AND 5),
		reason TEXT,
		note TEXT,
		task TEXT NOT NULL,
		context_switch BOOLEAN NOT NULL DEFAULT 0,
		FOREIGN KEY (day_id) REFERENCES day(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS pomodoro_sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		task_id INTEGER NOT NULL,
		start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		end_time TIMESTAMP,
		duration INTEGER NOT NULL,
		completed BOOLEAN DEFAULT 0,
		FOREIGN KEY (task_id) REFERENCES tasks(id)
	);

	CREATE INDEX IF NOT EXISTS idx_pomo_day ON pomo(day_id);
	CREATE INDEX IF NOT EXISTS idx_pomo_start ON pomo(start_time);
	CREATE INDEX IF NOT EXISTS idx_daily_tasks_day ON daily_tasks(day_id);
	CREATE INDEX IF NOT EXISTS idx_daily_tasks_planning ON daily_tasks(day_id, planned_at, added_mid_day);
	`

	_, err = db.Exec(schema)
	return err
}

// Handlers
func getTasks(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
		SELECT id, name, description, created_at, completed_at, is_completed 
		FROM tasks 
		ORDER BY created_at DESC
	`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tasks := []Task{}
	for rows.Next() {
		var task Task
		var completedAt sql.NullTime
		err := rows.Scan(&task.ID, &task.Name, &task.Description, &task.CreatedAt, &completedAt, &task.IsCompleted)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if completedAt.Valid {
			task.CompletedAt = &completedAt.Time
		}
		tasks = append(tasks, task)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func createTask(w http.ResponseWriter, r *http.Request) {
	var task Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := db.Exec(`
		INSERT INTO tasks (name, description) 
		VALUES (?, ?)
	`, task.Name, task.Description)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	task.ID = int(id)
	task.CreatedAt = time.Now()
	task.IsCompleted = false

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func updateTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var task Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var completedAt interface{}
	if task.CompletedAt != nil {
		completedAt = task.CompletedAt
	}

	_, err = db.Exec(`
		UPDATE tasks 
		SET name = ?, description = ?, is_completed = ?, completed_at = ?
		WHERE id = ?
	`, task.Name, task.Description, task.IsCompleted, completedAt, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	task.ID = id
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func deleteTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM tasks WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getSessions(w http.ResponseWriter, r *http.Request) {
	taskID := r.URL.Query().Get("task_id")
	
	var rows *sql.Rows
	var err error
	
	if taskID != "" {
		rows, err = db.Query(`
			SELECT id, task_id, start_time, end_time, duration, completed 
			FROM pomodoro_sessions 
			WHERE task_id = ?
			ORDER BY start_time DESC
		`, taskID)
	} else {
		rows, err = db.Query(`
			SELECT id, task_id, start_time, end_time, duration, completed 
			FROM pomodoro_sessions 
			ORDER BY start_time DESC
		`)
	}
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sessions := []PomodoroSession{}
	for rows.Next() {
		var session PomodoroSession
		var endTime sql.NullTime
		err := rows.Scan(&session.ID, &session.TaskID, &session.StartTime, &endTime, &session.Duration, &session.Completed)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if endTime.Valid {
			session.EndTime = &endTime.Time
		}
		sessions = append(sessions, session)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sessions)
}

func createSession(w http.ResponseWriter, r *http.Request) {
	var session PomodoroSession
	if err := json.NewDecoder(r.Body).Decode(&session); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := db.Exec(`
		INSERT INTO pomodoro_sessions (task_id, duration, completed, start_time, end_time) 
		VALUES (?, ?, ?, ?, ?)
	`, session.TaskID, session.Duration, session.Completed, session.StartTime, session.EndTime)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	session.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(session)
}

func getStatistics(w http.ResponseWriter, r *http.Request) {
	var stats Statistics

	// Total and completed sessions
	err := db.QueryRow(`
		SELECT 
			COUNT(*) as total,
			IFNULL(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed,
			IFNULL(SUM(duration), 0) as total_minutes
		FROM pomodoro_sessions
	`).Scan(&stats.TotalSessions, &stats.CompletedSessions, &stats.TotalMinutes)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Tasks completed
	err = db.QueryRow(`
		SELECT COUNT(*) FROM tasks WHERE is_completed = 1
	`).Scan(&stats.TasksCompleted)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Average focus time
	if stats.CompletedSessions > 0 {
		stats.AverageFocusTime = float64(stats.TotalMinutes) / float64(stats.CompletedSessions)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "ok",
		"time":   time.Now().Format(time.RFC3339),
	})
}

// Day handlers
func getDay(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	date := vars["date"]

	var day Day
	var startTime, endTime sql.NullTime
	var dayRating sql.NullInt64
	var mainDistraction, reflectionNotes, comment sql.NullString

	err := db.QueryRow(`
		SELECT id, date, target_pomos, finished_pomos, start_time, end_time, 
		       comment, day_rating, main_distraction, reflection_notes
		FROM day WHERE date = ?
	`, date).Scan(&day.ID, &day.Date, &day.TargetPomos, &day.FinishedPomos,
		&startTime, &endTime, &comment, &dayRating,
		&mainDistraction, &reflectionNotes)

	if err == sql.ErrNoRows {
		http.Error(w, "Day not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if startTime.Valid {
		day.StartTime = &startTime.Time
	}
	if endTime.Valid {
		day.EndTime = &endTime.Time
	}
	if dayRating.Valid {
		rating := int(dayRating.Int64)
		day.DayRating = &rating
	}
	if comment.Valid {
		day.Comment = comment.String
	}
	if mainDistraction.Valid {
		day.MainDistraction = mainDistraction.String
	}
	if reflectionNotes.Valid {
		day.ReflectionNotes = reflectionNotes.String
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(day)
}

func createOrUpdateDay(w http.ResponseWriter, r *http.Request) {
	var day Day
	if err := json.NewDecoder(r.Body).Decode(&day); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Check if day exists
	var existingID int
	err := db.QueryRow("SELECT id FROM day WHERE date = ?", day.Date).Scan(&existingID)

	if err == sql.ErrNoRows {
		// Insert new day
		result, err := db.Exec(`
			INSERT INTO day (date, target_pomos, finished_pomos, start_time, comment)
			VALUES (?, ?, ?, ?, ?)
		`, day.Date, day.TargetPomos, day.FinishedPomos, day.StartTime, day.Comment)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		id, _ := result.LastInsertId()
		day.ID = int(id)
		w.WriteHeader(http.StatusCreated)
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	} else {
		// Update existing day
		_, err = db.Exec(`
			UPDATE day 
			SET target_pomos = ?, finished_pomos = ?, start_time = ?, end_time = ?, comment = ?
			WHERE id = ?
		`, day.TargetPomos, day.FinishedPomos, day.StartTime, day.EndTime, day.Comment, existingID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		day.ID = existingID
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(day)
}

func updateDayReflection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid day ID", http.StatusBadRequest)
		return
	}

	var day Day
	if err := json.NewDecoder(r.Body).Decode(&day); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.Exec(`
		UPDATE day 
		SET day_rating = ?, main_distraction = ?, reflection_notes = ?, end_time = ?
		WHERE id = ?
	`, day.DayRating, day.MainDistraction, day.ReflectionNotes, time.Now(), id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// Daily task handlers
func getDailyTasks(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	dayID, err := strconv.Atoi(vars["day_id"])
	if err != nil {
		http.Error(w, "Invalid day ID", http.StatusBadRequest)
		return
	}

	rows, err := db.Query(`
		SELECT id, day_id, task_name, planned_pomodoros, planned_at, plan_priority,
		       pomodoros_spent, completed, created_at, completed_at, added_mid_day, reason_added
		FROM daily_tasks
		WHERE day_id = ?
		ORDER BY COALESCE(plan_priority, 999), id
	`, dayID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	tasks := []DailyTask{}
	for rows.Next() {
		var task DailyTask
		var plannedAt, completedAt sql.NullTime
		var planPriority sql.NullInt64

		err := rows.Scan(&task.ID, &task.DayID, &task.TaskName, &task.PlannedPomodoros,
			&plannedAt, &planPriority, &task.PomodorosSpent, &task.Completed,
			&task.CreatedAt, &completedAt, &task.AddedMidDay, &task.ReasonAdded)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if plannedAt.Valid {
			task.PlannedAt = &plannedAt.Time
		}
		if completedAt.Valid {
			task.CompletedAt = &completedAt.Time
		}
		if planPriority.Valid {
			priority := int(planPriority.Int64)
			task.PlanPriority = &priority
		}

		tasks = append(tasks, task)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func createDailyTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	dayID, err := strconv.Atoi(vars["day_id"])
	if err != nil {
		http.Error(w, "Invalid day ID", http.StatusBadRequest)
		return
	}

	var task DailyTask
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	task.DayID = dayID
	result, err := db.Exec(`
		INSERT INTO daily_tasks (day_id, task_name, planned_pomodoros, planned_at, plan_priority,
		                        pomodoros_spent, completed, created_at, added_mid_day, reason_added)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, task.DayID, task.TaskName, task.PlannedPomodoros, task.PlannedAt, task.PlanPriority,
		task.PomodorosSpent, task.Completed, time.Now(), task.AddedMidDay, task.ReasonAdded)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	task.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func updateDailyTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	var task DailyTask
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.Exec(`
		UPDATE daily_tasks 
		SET task_name = ?, planned_pomodoros = ?, planned_at = ?, plan_priority = ?,
		    pomodoros_spent = ?, completed = ?, completed_at = ?, added_mid_day = ?, reason_added = ?
		WHERE id = ?
	`, task.TaskName, task.PlannedPomodoros, task.PlannedAt, task.PlanPriority,
		task.PomodorosSpent, task.Completed, task.CompletedAt, task.AddedMidDay, task.ReasonAdded, id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	task.ID = id
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func deleteDailyTask(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid task ID", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM daily_tasks WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Pomodoro detail handlers
func createPomodoro(w http.ResponseWriter, r *http.Request) {
	var pomo PomodoroDetail
	if err := json.NewDecoder(r.Body).Decode(&pomo); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	result, err := db.Exec(`
		INSERT INTO pomo (day_id, start_time, end_time, duration_sec, aborted, 
		                 focus_score, reason, note, task, context_switch, pause_count)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, pomo.DayID, pomo.StartTime, pomo.EndTime, pomo.DurationSec, pomo.Aborted,
		pomo.FocusScore, pomo.Reason, pomo.Note, pomo.Task, pomo.ContextSwitch, pomo.PauseCount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	pomo.ID = int(id)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(pomo)
}

func getPomodoros(w http.ResponseWriter, r *http.Request) {
	// Optional query parameters for filtering
	dayID := r.URL.Query().Get("day_id")
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	query := `SELECT id, day_id, start_time, end_time, duration_sec, aborted, 
	                 focus_score, reason, note, task, context_switch, pause_count 
	          FROM pomo WHERE 1=1`
	args := []interface{}{}

	if dayID != "" {
		query += " AND day_id = ?"
		args = append(args, dayID)
	}

	if startDate != "" && endDate != "" {
		query += " AND DATE(start_time) BETWEEN ? AND ?"
		args = append(args, startDate, endDate)
	}

	query += " ORDER BY start_time DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var pomodoros []PomodoroDetail
	for rows.Next() {
		var p PomodoroDetail
		err := rows.Scan(&p.ID, &p.DayID, &p.StartTime, &p.EndTime, &p.DurationSec,
			&p.Aborted, &p.FocusScore, &p.Reason, &p.Note, &p.Task, &p.ContextSwitch, &p.PauseCount)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		pomodoros = append(pomodoros, p)
	}

	if pomodoros == nil {
		pomodoros = []PomodoroDetail{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pomodoros)
}

func main() {
	// Initialize database
	if err := initDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Setup router
	r := mux.NewRouter()

	// Routes
	r.HandleFunc("/health", healthCheck).Methods("GET")
	
	// Legacy task routes
	r.HandleFunc("/api/tasks", getTasks).Methods("GET")
	r.HandleFunc("/api/tasks", createTask).Methods("POST")
	r.HandleFunc("/api/tasks/{id}", updateTask).Methods("PUT")
	r.HandleFunc("/api/tasks/{id}", deleteTask).Methods("DELETE")
	
	// Legacy session routes
	r.HandleFunc("/api/sessions", getSessions).Methods("GET")
	r.HandleFunc("/api/sessions", createSession).Methods("POST")
	r.HandleFunc("/api/statistics", getStatistics).Methods("GET")
	
	// Day routes
	r.HandleFunc("/api/days/{date}", getDay).Methods("GET")
	r.HandleFunc("/api/days", createOrUpdateDay).Methods("POST")
	r.HandleFunc("/api/days/{id}/reflection", updateDayReflection).Methods("PUT")
	
	// Daily task routes
	r.HandleFunc("/api/days/{day_id}/tasks", getDailyTasks).Methods("GET")
	r.HandleFunc("/api/days/{day_id}/tasks", createDailyTask).Methods("POST")
	r.HandleFunc("/api/daily-tasks/{id}", updateDailyTask).Methods("PUT")
	r.HandleFunc("/api/daily-tasks/{id}", deleteDailyTask).Methods("DELETE")
	
	// Enhanced pomodoro routes
	r.HandleFunc("/api/pomodoros", getPomodoros).Methods("GET")
	r.HandleFunc("/api/pomodoros", createPomodoro).Methods("POST")

	// CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("🚀 Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
