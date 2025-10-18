/**
 * API Client for Hardmode Pomo Backend
 * Connects to Go REST API at localhost:8080
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ==================== DAY ENDPOINTS ====================
  
  /**
   * Get all days
   * GET /api/days
   */
  async getDays() {
    return this.request('/api/days');
  }

  /**
   * Get day by date (YYYY-MM-DD)
   * GET /api/days/:date
   */
  async getDayByDate(date) {
    return this.request(`/api/days/${date}`);
  }

  /**
   * Create a new day
   * POST /api/days
   */
  async createDay(dayData) {
    return this.request('/api/days', {
      method: 'POST',
      body: JSON.stringify(dayData),
    });
  }

  /**
   * Update a day (uses same endpoint as create - upsert)
   * POST /api/days
   */
  async updateDay(date, dayData) {
    // Backend uses POST for both create and update (upsert)
    // Make sure to include the date in the dayData
    return this.request('/api/days', {
      method: 'POST',
      body: JSON.stringify({ ...dayData, date }),
    });
  }

  /**
   * Delete a day
   * DELETE /api/days/:date
   */
  async deleteDay(date) {
    return this.request(`/api/days/${date}`, {
      method: 'DELETE',
    });
  }

  // ==================== TASK ENDPOINTS ====================
  
  /**
   * Get all tasks for a specific day
   * GET /api/days/:day_id/tasks
   */
  async getDailyTasks(dayId) {
    return this.request(`/api/days/${dayId}/tasks`);
  }

  /**
   * Create a new task
   * POST /api/days/:day_id/tasks
   */
  async createTask(dayId, taskData) {
    return this.request(`/api/days/${dayId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  /**
   * Update a task
   * PUT /api/daily-tasks/:id
   */
  async updateTask(taskId, taskData) {
    return this.request(`/api/daily-tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  /**
   * Delete a task
   * DELETE /api/daily-tasks/:id
   */
  async deleteTask(taskId) {
    return this.request(`/api/daily-tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // ==================== POMODORO ENDPOINTS ====================
  
  /**
   * Get all pomodoros for a task
   * GET /api/tasks/:task_id/pomodoros
   */
  async getTaskPomodoros(taskId) {
    return this.request(`/api/tasks/${taskId}/pomodoros`);
  }

  /**
   * Create a new pomodoro
   * POST /api/pomodoros
   */
  async createPomodoro(taskId, pomodoroData) {
    return this.request(`/api/pomodoros`, {
      method: 'POST',
      body: JSON.stringify(pomodoroData),
    });
  }

  /**
   * Update a pomodoro
   * PUT /api/pomodoros/:id
   */
  async updatePomodoro(pomodoroId, pomodoroData) {
    return this.request(`/api/pomodoros/${pomodoroId}`, {
      method: 'PUT',
      body: JSON.stringify(pomodoroData),
    });
  }

  /**
   * Delete a pomodoro
   * DELETE /api/pomodoros/:id
   */
  async deletePomodoro(pomodoroId) {
    return this.request(`/api/pomodoros/${pomodoroId}`, {
      method: 'DELETE',
    });
  }

  // ==================== ANALYTICS ENDPOINTS ====================
  
  /**
   * Get analytics for date range
   * GET /api/analytics?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
   */
  async getAnalytics(startDate, endDate) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    return this.request(`/api/analytics?${params}`);
  }

  /**
   * Get streak information
   * GET /api/streak
   */
  async getStreak() {
    return this.request('/api/streak');
  }

  // ==================== SYNC ENDPOINTS ====================
  
  /**
   * Get last sync timestamp
   * GET /api/sync/last
   */
  async getLastSync() {
    return this.request('/api/sync/last');
  }

  /**
   * Trigger manual sync
   * POST /api/sync
   */
  async triggerSync() {
    return this.request('/api/sync', {
      method: 'POST',
    });
  }

  // ==================== HEALTH CHECK ====================
  
  /**
   * Check if backend is alive
   * GET /health
   */
  async healthCheck() {
    return this.request('/health');
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
