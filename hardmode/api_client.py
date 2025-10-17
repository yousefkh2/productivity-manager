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
