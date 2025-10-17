"""
API Client for Hardmode Pomodoro Backend
Handles communication with the Go REST API with offline fallback
"""

import requests
import json
from typing import List, Dict, Optional
from datetime import datetime
import os


class APIClient:
    """Client for communicating with the Hardmode Pomodoro API"""
    
    def __init__(self, base_url: str = None):
        """
        Initialize the API client
        
        Args:
            base_url: Base URL of the API (defaults to localhost:8080)
        """
        self.base_url = base_url or os.getenv('API_URL', 'http://localhost:8080')
        self.timeout = 5  # seconds
        self._online = True
        
    def _request(self, method: str, endpoint: str, **kwargs) -> Optional[Dict]:
        """
        Make an HTTP request to the API
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            **kwargs: Additional arguments for requests
            
        Returns:
            Response data as dict, or None if request failed
        """
        url = f"{self.base_url}{endpoint}"
        kwargs['timeout'] = kwargs.get('timeout', self.timeout)
        
        try:
            response = requests.request(method, url, **kwargs)
            response.raise_for_status()
            self._online = True
            
            if response.status_code == 204:  # No content
                return {}
            
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            self._online = False
            return None
    
    def is_online(self) -> bool:
        """Check if the API is reachable"""
        result = self._request('GET', '/health')
        return result is not None
    
    # Task methods
    def get_tasks(self) -> Optional[List[Dict]]:
        """Get all tasks"""
        return self._request('GET', '/api/tasks')
    
    def create_task(self, name: str, description: str = "") -> Optional[Dict]:
        """
        Create a new task
        
        Args:
            name: Task name
            description: Task description
            
        Returns:
            Created task data
        """
        data = {
            'name': name,
            'description': description
        }
        return self._request('POST', '/api/tasks', json=data)
    
    def update_task(self, task_id: int, name: str = None, description: str = None, 
                   is_completed: bool = None, completed_at: str = None) -> Optional[Dict]:
        """
        Update an existing task
        
        Args:
            task_id: ID of the task to update
            name: New task name
            description: New task description
            is_completed: Completion status
            completed_at: Completion timestamp (ISO format)
            
        Returns:
            Updated task data
        """
        data = {}
        if name is not None:
            data['name'] = name
        if description is not None:
            data['description'] = description
        if is_completed is not None:
            data['is_completed'] = is_completed
        if completed_at is not None:
            data['completed_at'] = completed_at
            
        return self._request('PUT', f'/api/tasks/{task_id}', json=data)
    
    def delete_task(self, task_id: int) -> bool:
        """
        Delete a task
        
        Args:
            task_id: ID of the task to delete
            
        Returns:
            True if deleted successfully
        """
        result = self._request('DELETE', f'/api/tasks/{task_id}')
        return result is not None
    
    # Session methods
    def get_sessions(self, task_id: Optional[int] = None) -> Optional[List[Dict]]:
        """
        Get pomodoro sessions
        
        Args:
            task_id: Optional task ID to filter sessions
            
        Returns:
            List of sessions
        """
        params = {'task_id': task_id} if task_id else {}
        return self._request('GET', '/api/sessions', params=params)
    
    def create_session(self, task_id: int, duration: int, completed: bool = False,
                      start_time: str = None, end_time: str = None) -> Optional[Dict]:
        """
        Create a new pomodoro session
        
        Args:
            task_id: ID of the associated task
            duration: Duration in minutes
            completed: Whether the session was completed
            start_time: Start time (ISO format, defaults to now)
            end_time: End time (ISO format)
            
        Returns:
            Created session data
        """
        now = datetime.now()
        data = {
            'task_id': task_id,
            'duration': duration,
            'completed': completed,
            'start_time': (start_time or now.isoformat()) + 'Z',
        }
        if end_time:
            data['end_time'] = end_time if end_time.endswith('Z') else end_time + 'Z'
        elif completed:
            # If completed, set end time to start + duration
            from datetime import timedelta
            end = now + timedelta(minutes=duration)
            data['end_time'] = end.isoformat() + 'Z'
            
        return self._request('POST', '/api/sessions', json=data)
    
    # Statistics methods
    def get_statistics(self) -> Optional[Dict]:
        """
        Get overall statistics
        
        Returns:
            Statistics data including total sessions, completed sessions, etc.
        """
        return self._request('GET', '/api/statistics')
    
    # Day methods
    def get_day(self, date: str) -> Optional[Dict]:
        """
        Get day by date (YYYY-MM-DD)
        
        Args:
            date: Date in YYYY-MM-DD format
            
        Returns:
            Day data including target_pomos, finished_pomos, reflection, etc.
        """
        return self._request('GET', f'/api/days/{date}')
    
    def create_or_update_day(self, date: str, target_pomos: int = 0, finished_pomos: int = 0,
                            start_time: str = None, end_time: str = None, comment: str = "",
                            day_rating: int = None, main_distraction: str = "",
                            reflection_notes: str = "") -> Optional[Dict]:
        """
        Create or update a day
        
        Args:
            date: Date in YYYY-MM-DD format
            target_pomos: Target number of pomodoros
            finished_pomos: Finished number of pomodoros
            start_time: Start time (ISO format)
            end_time: End time (ISO format)
            comment: Day comment
            day_rating: 1-5 star rating
            main_distraction: Main distraction text
            reflection_notes: End-of-day reflection notes
            
        Returns:
            Created/updated day data
        """
        data = {
            'date': date,
            'target_pomos': target_pomos,
            'finished_pomos': finished_pomos,
            'comment': comment,
            'main_distraction': main_distraction,
            'reflection_notes': reflection_notes,
        }
        if start_time:
            data['start_time'] = start_time
        if end_time:
            data['end_time'] = end_time
        if day_rating is not None:
            data['day_rating'] = day_rating
            
        return self._request('POST', '/api/days', json=data)
    
    def update_day_reflection(self, day_id: int, day_rating: int, 
                             main_distraction: str = "", reflection_notes: str = "") -> Optional[Dict]:
        """
        Update end-of-day reflection
        
        Args:
            day_id: Day ID
            day_rating: 1-5 star rating
            main_distraction: Main distraction text
            reflection_notes: Reflection notes
            
        Returns:
            Updated day data
        """
        data = {
            'day_rating': day_rating,
            'main_distraction': main_distraction,
            'reflection_notes': reflection_notes,
        }
        return self._request('PUT', f'/api/days/{day_id}/reflection', json=data)
    
    # Daily Task methods
    def get_daily_tasks(self, day_id: int) -> Optional[List[Dict]]:
        """
        Get all daily tasks for a day
        
        Args:
            day_id: Day ID
            
        Returns:
            List of daily tasks with planning and execution data
        """
        return self._request('GET', f'/api/days/{day_id}/tasks')
    
    def create_daily_task(self, day_id: int, task_name: str, planned_pomodoros: int = 0,
                         plan_priority: int = None, added_mid_day: bool = False,
                         reason_added: str = "") -> Optional[Dict]:
        """
        Create a daily task
        
        Args:
            day_id: Day ID
            task_name: Task name
            planned_pomodoros: Planned number of pomodoros
            plan_priority: Priority (1st, 2nd, 3rd...)
            added_mid_day: Whether added mid-day (vs planned)
            reason_added: Reason for mid-day addition (category | details)
            
        Returns:
            Created daily task data
        """
        data = {
            'task_name': task_name,
            'planned_pomodoros': planned_pomodoros,
            'added_mid_day': added_mid_day,
            'reason_added': reason_added,
        }
        if plan_priority is not None:
            data['plan_priority'] = plan_priority
            
        return self._request('POST', f'/api/days/{day_id}/tasks', json=data)
    
    def update_daily_task(self, task_id: int, task_name: str = None, 
                         planned_pomodoros: int = None, pomodoros_spent: int = None,
                         completed: bool = None, completed_at: str = None) -> Optional[Dict]:
        """
        Update a daily task
        
        Args:
            task_id: Daily task ID
            task_name: Task name
            planned_pomodoros: Planned pomodoros
            pomodoros_spent: Actual pomodoros spent
            completed: Completion status
            completed_at: Completion time (ISO format)
            
        Returns:
            Updated daily task data
        """
        data = {}
        if task_name is not None:
            data['task_name'] = task_name
        if planned_pomodoros is not None:
            data['planned_pomodoros'] = planned_pomodoros
        if pomodoros_spent is not None:
            data['pomodoros_spent'] = pomodoros_spent
        if completed is not None:
            data['completed'] = completed
        if completed_at is not None:
            data['completed_at'] = completed_at
            
        return self._request('PUT', f'/api/daily-tasks/{task_id}', json=data)
    
    def delete_daily_task(self, task_id: int) -> bool:
        """
        Delete a daily task
        
        Args:
            task_id: Daily task ID
            
        Returns:
            True if deleted successfully
        """
        result = self._request('DELETE', f'/api/daily-tasks/{task_id}')
        return result is not None
    
    # Enhanced Pomodoro methods
    def create_pomodoro(self, day_id: int, start_time: str, duration_sec: int,
                       aborted: bool = False, end_time: str = None,
                       focus_score: int = None, reason: str = "", note: str = "",
                       task: str = "", context_switch: bool = False) -> Optional[Dict]:
        """
        Create an enhanced pomodoro with rich tracking data
        
        Args:
            day_id: Day ID
            start_time: Start time (ISO format)
            duration_sec: Duration in seconds
            aborted: Whether aborted
            end_time: End time (ISO format)
            focus_score: Focus score 1-5
            reason: Reason (for abort or low focus)
            note: Optional note
            task: Task name
            context_switch: Whether a context switch occurred
            
        Returns:
            Created pomodoro data
        """
        data = {
            'day_id': day_id,
            'start_time': start_time,
            'duration_sec': duration_sec,
            'aborted': aborted,
            'reason': reason,
            'note': note,
            'task': task,
            'context_switch': context_switch,
        }
        if end_time:
            data['end_time'] = end_time
        if focus_score is not None:
            data['focus_score'] = focus_score
            
        return self._request('POST', '/api/pomodoros', json=data)


# Example usage
if __name__ == '__main__':
    # Initialize client
    client = APIClient()
    
    # Check connectivity
    print(f"API Online: {client.is_online()}")
    
    # Create a task
    task = client.create_task("Test Task", "This is a test task")
    print(f"Created task: {task}")
    
    # Get all tasks
    tasks = client.get_tasks()
    print(f"All tasks: {tasks}")
    
    # Create a session
    if task:
        session = client.create_session(
            task_id=task['id'],
            duration=25,
            completed=True
        )
        print(f"Created session: {session}")
    
    # Get statistics
    stats = client.get_statistics()
    print(f"Statistics: {stats}")
