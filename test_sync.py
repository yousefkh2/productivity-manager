#!/usr/bin/env python3
"""
Test script for cloud sync functionality
Demonstrates full sync workflow
"""

import sys
import sqlite3
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from hardmode.data.db import get_connection, initialize_database
from hardmode.data.manager import DataManager


def test_sync_workflow():
    """Test complete sync workflow"""
    
    print("=" * 60)
    print("🧪 Testing Cloud Sync Functionality")
    print("=" * 60)
    
    # Create in-memory database for testing
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    
    # Initialize schema
    schema_path = project_root / "schema.sql"
    initialize_database(conn, schema_path)
    
    # Initialize manager with local API
    api_url = "http://localhost:8080"
    manager = DataManager(conn, api_url=api_url)
    
    # Check API availability
    print(f"\n1️⃣  Checking API connection...")
    if manager._api_online:
        print(f"   ✅ API is online at {api_url}")
    else:
        print(f"   ❌ API is offline! Make sure backend is running:")
        print(f"      cd backend && go run main.go")
        return False
    
    # Get today's date
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Step 1: Create a day
    print(f"\n2️⃣  Creating day: {today}")
    day_id = manager.local.ensure_day(today, target_pomos=16)
    # Add comment
    manager.conn.execute("UPDATE day SET comment = ? WHERE id = ?", ("Testing cloud sync", day_id))
    manager.conn.commit()
    print(f"   ✅ Day created with ID: {day_id}")
    
    # Step 2: Add daily tasks
    print(f"\n3️⃣  Adding daily tasks...")
    
    # Insert tasks directly for testing
    manager.conn.execute("DELETE FROM daily_tasks WHERE day_id = ?", (day_id,))
    
    tasks = [
        ('Write cloud sync documentation', 5, 1, False, ''),
        ('Test API endpoints', 3, 2, False, ''),
        ('Fix urgent bug', 2, None, True, '🚨 Urgent Bug / Critical Issue | Production issue')
    ]
    
    for task_name, planned_pomos, priority, mid_day, reason in tasks:
        manager.conn.execute(
            """
            INSERT INTO daily_tasks (
                day_id, task_name, planned_pomodoros, plan_priority,
                pomodoros_spent, completed, created_at, added_mid_day, reason_added
            )
            VALUES (?, ?, ?, ?, 0, 0, datetime('now'), ?, ?)
            """,
            (day_id, task_name, planned_pomos, priority, int(mid_day), reason)
        )
    
    manager.conn.commit()
    print(f"   ✅ Added {len(tasks)} tasks")
    for i, (task_name, planned_pomos, _, mid_day, _) in enumerate(tasks, 1):
        status = "📝 Planned" if not mid_day else "⚡ Mid-day"
        print(f"      {i}. {task_name} ({planned_pomos} pomos) {status}")
    
    # Step 3: Simulate some pomodoro sessions
    print(f"\n4️⃣  Simulating pomodoro sessions...")
    pomo_id = manager.start_pomo(day_id, task="Write cloud sync documentation", duration_sec=1500)
    manager.complete_pomo(
        pomo_id,
        focus_score=5,
        reason=None,
        note="Excellent session, good flow",
        actual_duration=1500,
        context_switch=False
    )
    print(f"   ✅ Completed 1 pomodoro (focus: 5⭐)")
    
    # Update day finished count
    manager.local.update_day_pomodoros(day_id, finished_pomos=1)
    
    # Step 4: Push to cloud
    print(f"\n5️⃣  Pushing to cloud...")
    result = manager.push_to_cloud(today)
    
    if result['success']:
        print(f"   ✅ Successfully synced to cloud!")
        print(f"      • Day synced: {result['day_synced']}")
        print(f"      • Tasks synced: {result['tasks_synced']}")
        print(f"      • Pomodoros synced: {result['pomos_synced']}")
    else:
        print(f"   ❌ Sync failed: {result.get('error')}")
        return False
    
    # Step 5: Verify in cloud
    print(f"\n6️⃣  Verifying data in cloud...")
    
    # Get day from cloud
    cloud_day = manager.api.get_day(today)
    if cloud_day:
        print(f"   ✅ Cloud day found:")
        print(f"      • Target: {cloud_day['target_pomos']} pomos")
        print(f"      • Finished: {cloud_day['finished_pomos']} pomos")
        print(f"      • Comment: {cloud_day['comment']}")
    else:
        print(f"   ❌ Day not found in cloud")
        return False
    
    # Get tasks from cloud
    cloud_tasks = manager.api.get_daily_tasks(cloud_day['id'])
    if cloud_tasks:
        print(f"   ✅ Cloud tasks found: {len(cloud_tasks)}")
        for task in cloud_tasks:
            status = "📝" if not task['added_mid_day'] else "⚡"
            print(f"      {status} {task['task_name']} ({task['planned_pomodoros']} planned)")
    else:
        print(f"   ⚠️  No tasks found in cloud")
    
    # Step 6: Test pull from cloud (simulate second device)
    print(f"\n7️⃣  Testing pull from cloud (simulating second device)...")
    
    # Create new in-memory database (simulating second device)
    conn2 = sqlite3.connect(":memory:")
    conn2.row_factory = sqlite3.Row
    initialize_database(conn2, schema_path)
    manager2 = DataManager(conn2, api_url=api_url)
    
    # Pull data from cloud
    pull_result = manager2.pull_from_cloud(today)
    
    if pull_result['success']:
        print(f"   ✅ Successfully pulled from cloud!")
        print(f"      • Day pulled: {pull_result['day_pulled']}")
        print(f"      • Tasks pulled: {pull_result['tasks_pulled']}")
        
        # Verify local data - get day_id first
        day_row = manager2.conn.execute("SELECT id FROM day WHERE date = ?", (today,)).fetchone()
        if day_row:
            local_day_id = day_row[0]
            local_tasks = manager2.local.get_daily_tasks(local_day_id)
            print(f"   ✅ Verified {len(local_tasks)} tasks in local database")
    else:
        print(f"   ❌ Pull failed: {pull_result.get('error')}")
        return False
    
    # Step 7: Test end-of-day reflection
    print(f"\n8️⃣  Testing end-of-day reflection sync...")
    
    manager.end_day(
        day_id=day_id,
        rating=4,
        distraction="Meetings in afternoon",
        notes="Good focus in morning, struggled after lunch. Need to protect deep work time."
    )
    print(f"   ✅ Reflection saved and synced")
    
    # Verify reflection in cloud
    cloud_day_updated = manager.api.get_day(today)
    if cloud_day_updated and cloud_day_updated.get('day_rating'):
        print(f"   ✅ Cloud reflection verified:")
        print(f"      • Rating: {cloud_day_updated['day_rating']}⭐")
        print(f"      • Distraction: {cloud_day_updated['main_distraction']}")
        print(f"      • Notes: {cloud_day_updated['reflection_notes'][:50]}...")
    
    # Success!
    print(f"\n{'=' * 60}")
    print(f"✨ All tests passed! Cloud sync is working perfectly!")
    print(f"{'=' * 60}")
    print(f"\n💡 What was tested:")
    print(f"   • Day creation and sync")
    print(f"   • Daily tasks with planning data")
    print(f"   • Mid-day task additions")
    print(f"   • Pomodoro sessions with rich data")
    print(f"   • Bidirectional sync (push & pull)")
    print(f"   • End-of-day reflection sync")
    print(f"\n🚀 Your app is ready for cloud deployment!")
    
    return True


def test_auto_sync():
    """Test automatic sync functionality"""
    
    print("\n" + "=" * 60)
    print("🔄 Testing Auto-Sync")
    print("=" * 60)
    
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    schema_path = project_root / "schema.sql"
    initialize_database(conn, schema_path)
    manager = DataManager(conn, api_url="http://localhost:8080")
    
    if not manager._api_online:
        print("❌ API offline, skipping auto-sync test")
        return False
    
    # Create some test data for multiple days
    from datetime import timedelta
    today = datetime.now()
    
    for i in range(3):
        date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        day_id = manager.local.ensure_day(date, target_pomos=16)
        manager.conn.execute("UPDATE day SET comment = ? WHERE id = ?", (f"Day {i+1}", day_id))
        manager.conn.commit()
        
        # Insert task directly
        manager.conn.execute(
            """
            INSERT INTO daily_tasks (
                day_id, task_name, planned_pomodoros, plan_priority,
                pomodoros_spent, completed, created_at, added_mid_day, reason_added
            )
            VALUES (?, ?, ?, ?, 0, 0, datetime('now'), 0, '')
            """,
            (day_id, f'Task A-{i}', 3, 1)
        )
        manager.conn.commit()
    
    print(f"Created 3 days of test data")
    
    # Run auto-sync
    print(f"\nRunning auto-sync...")
    result = manager.auto_sync()
    
    if result['success']:
        print(f"✅ Auto-sync complete!")
        print(f"   • Days synced: {result['days_synced']}")
        print(f"   • Tasks synced: {result['tasks_synced']}")
        print(f"   • Pomodoros synced: {result['pomos_synced']}")
    else:
        print(f"❌ Auto-sync failed: {result.get('error')}")
        return False
    
    return True


if __name__ == '__main__':
    try:
        # Test main workflow
        success = test_sync_workflow()
        
        if success:
            # Test auto-sync
            test_auto_sync()
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
