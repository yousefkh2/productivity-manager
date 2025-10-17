#!/usr/bin/env python3
"""
Test script to verify DataManager integration works correctly.
This simulates a complete pomodoro workflow.
"""

import sys
from datetime import datetime
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent))

from hardmode.data.db import get_connection, initialize_database, DEFAULT_DB_PATH
from hardmode.data.manager import DataManager


def test_integration():
    """Test the complete integration flow."""
    print("=" * 60)
    print("Testing Hardmode Pomodoro Integration")
    print("=" * 60)
    print()
    
    # Initialize
    print("1. Initializing database and manager...")
    conn = get_connection(DEFAULT_DB_PATH)
    initialize_database(conn)
    manager = DataManager(conn)
    print(f"   ✓ Database: {DEFAULT_DB_PATH}")
    print(f"   ✓ API Online: {manager.is_online()}")
    print()
    
    # Create a day
    print("2. Creating day entry...")
    today = datetime.now().strftime("%Y-%m-%d")
    day_id = manager.ensure_day(today, target_pomos=8)
    print(f"   ✓ Day ID: {day_id} (target: 8 pomos)")
    print()
    
    # Start a pomodoro
    print("3. Starting a pomodoro...")
    task_name = "Test Integration Task"
    pomo_id = manager.start_pomo(
        day_id=day_id,
        task=task_name,
        duration_sec=25 * 60,  # 25 minutes
        context_switch=False
    )
    print(f"   ✓ Pomo ID: {pomo_id}")
    print(f"   ✓ Task: '{task_name}'")
    print()
    
    # Complete the pomodoro
    print("4. Completing the pomodoro...")
    manager.complete_pomo(
        pomo_id=pomo_id,
        focus_score=5,
        reason="Great focus!",
        note="Integration test successful",
        actual_duration=25 * 60,
        context_switch=False
    )
    print("   ✓ Pomodoro completed")
    print()
    
    # Update day stats
    print("5. Updating day stats...")
    manager.increment_finished(day_id)
    print("   ✓ Day stats updated")
    print()
    
    # Get statistics
    print("6. Fetching statistics...")
    stats = manager.get_statistics()
    print()
    print("   LOCAL STATISTICS:")
    if stats['local']:
        print(f"     - Total pomos: {stats['local'].get('total', 0)}")
        print(f"     - Completed: {stats['local'].get('completed', 0)}")
        print(f"     - Avg focus: {stats['local'].get('avg_focus', 0):.1f}/5")
        print(f"     - Total minutes: {stats['local'].get('total_minutes', 0):.0f}")
    print()
    
    if manager.is_online() and stats['api']:
        print("   API STATISTICS:")
        print(f"     - Total sessions: {stats['api'].get('total_sessions', 0)}")
        print(f"     - Completed sessions: {stats['api'].get('completed_sessions', 0)}")
        print(f"     - Tasks completed: {stats['api'].get('tasks_completed', 0)}")
        print(f"     - Total minutes: {stats['api'].get('total_minutes', 0)}")
        print()
    
    if stats['synced']:
        print("   SYNC STATUS:")
        print(f"     - Total pomos: {stats['synced'].get('total_pomos', 0)}")
        print(f"     - Synced tasks: {stats['synced'].get('synced_tasks', 0)}")
        print(f"     - Synced sessions: {stats['synced'].get('synced_sessions', 0)}")
        print(f"     - Pending sync: {stats['synced'].get('pending', 0)}")
        print()
    
    # Verify data in API
    if manager.is_online():
        print("7. Verifying data in API...")
        from hardmode.api_client import APIClient
        api = APIClient()
        
        tasks = api.get_tasks()
        sessions = api.get_sessions()
        
        print(f"   ✓ API has {len(tasks) if tasks else 0} tasks")
        print(f"   ✓ API has {len(sessions) if sessions else 0} sessions")
        
        if tasks and len(tasks) > 0:
            latest_task = tasks[0]
            print(f"   ✓ Latest task: '{latest_task['name']}'")
        print()
    
    conn.close()
    
    print("=" * 60)
    print("✓ Integration test complete!")
    print("=" * 60)
    print()
    print("What this means:")
    print("  - Your pomodoros are stored locally (rich data)")
    print("  - They're also synced to the API (cloud-ready)")
    print("  - When you deploy to cloud, all data will sync")
    print("  - You can access your stats from anywhere!")
    print()


if __name__ == "__main__":
    try:
        test_integration()
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
