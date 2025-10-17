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
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at"`
	IsCompleted bool      `json:"is_completed"`
}

type PomodoroSession struct {
	ID        int       `json:"id"`
	TaskID    int       `json:"task_id"`
	StartTime time.Time `json:"start_time"`
	EndTime   *time.Time `json:"end_time"`
	Duration  int       `json:"duration"`
	Completed bool      `json:"completed"`
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

	CREATE TABLE IF NOT EXISTS pomodoro_sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		task_id INTEGER NOT NULL,
		start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		end_time TIMESTAMP,
		duration INTEGER NOT NULL,
		completed BOOLEAN DEFAULT 0,
		FOREIGN KEY (task_id) REFERENCES tasks(id)
	);
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
	r.HandleFunc("/api/tasks", getTasks).Methods("GET")
	r.HandleFunc("/api/tasks", createTask).Methods("POST")
	r.HandleFunc("/api/tasks/{id}", updateTask).Methods("PUT")
	r.HandleFunc("/api/tasks/{id}", deleteTask).Methods("DELETE")
	r.HandleFunc("/api/sessions", getSessions).Methods("GET")
	r.HandleFunc("/api/sessions", createSession).Methods("POST")
	r.HandleFunc("/api/statistics", getStatistics).Methods("GET")

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
