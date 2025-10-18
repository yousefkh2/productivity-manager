import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudOff, Calendar, TrendingUp, BarChart3, Timer as TimerIcon } from 'lucide-react';
import Timer from './components/Timer';
import TaskList from './components/TaskList';
import DailyIntent from './components/DailyIntent';
import EndDayDialog from './components/EndDayDialog';
import Analytics from './components/Analytics';
import api from './api/client';

function App() {
  // State
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayData, setDayData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showDailyIntent, setShowDailyIntent] = useState(false);
  const [showEndDay, setShowEndDay] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timer'); // 'timer' | 'analytics'

  // Load today's data on mount
  useEffect(() => {
    loadDayData();
    checkBackendHealth();
  }, [currentDate]);

  const checkBackendHealth = async () => {
    try {
      await api.healthCheck();
      setIsOnline(true);
    } catch (error) {
      console.error('Backend offline:', error);
      setIsOnline(false);
    }
  };

  const loadDayData = async () => {
    setLoading(true);
    try {
      // Try to load existing day
      const day = await api.getDayByDate(currentDate);
      setDayData(day);

      // Load tasks using the day ID
      const tasksData = await api.getDailyTasks(day.id);
      setTasks(tasksData || []);

      // Auto-select first incomplete task if none selected
      if (tasksData && tasksData.length > 0 && !selectedTaskId) {
        const firstIncomplete = tasksData.find(t => !t.is_completed);
        if (firstIncomplete) {
          setSelectedTaskId(firstIncomplete.id);
        }
      }

      // Show planning modal ONLY on first visit if no tasks exist yet
      if (tasksData && tasksData.length === 0 && !sessionStorage.getItem(`plan_prompted_${currentDate}`)) {
        setTimeout(() => setShowDailyIntent(true), 500);
        sessionStorage.setItem(`plan_prompted_${currentDate}`, 'true');
      }
    } catch (error) {
      // Day doesn't exist, create it
      try {
        const newDay = await api.createDay({
          date: currentDate,
          target_pomos: 0,
          finished_pomos: 0,
        });
        setDayData(newDay);
        setTasks([]);
        
        // Show planning modal on first visit of the day
        setTimeout(() => setShowDailyIntent(true), 500);
        sessionStorage.setItem(`plan_prompted_${currentDate}`, 'true');
      } catch (createError) {
        console.error('Failed to create day:', createError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Task handlers
  const handleAddTask = async (taskData) => {
    try {
      if (!dayData || !dayData.id) {
        console.error('No day data available');
        return;
      }
      
      const newTask = await api.createTask(dayData.id, taskData);
      setTasks([...tasks, newTask]);
      
      // Auto-select the newly added task
      setSelectedTaskId(newTask.id);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const updatedTask = await api.updateTask(taskId, taskData);
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      
      // Clear selection if deleted task was selected
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handlePomodoroComplete = async (taskId, reviewData = null, actualDuration = 1500, pauseCount = 0) => {
    if (!taskId) return;

    try {
      // Update task's pomodoro count (pomodoros_spent in backend)
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await handleUpdateTask(taskId, {
          ...task,
          pomodoros_spent: (task.pomodoros_spent || 0) + 1,
        });
      }

      // Save review data if provided
      if (reviewData && dayData?.id) {
        const now = new Date();
        // Use actual duration from timer (10 seconds in testing, 1500 in production)
        const durationSec = actualDuration;
        const startTime = new Date(now.getTime() - durationSec * 1000);
        
        console.log('Saving pomodoro review:', reviewData, 'Duration:', durationSec, 'seconds', 'Pauses:', pauseCount);
        
        await api.createPomodoro({
          day_id: dayData.id,
          start_time: startTime.toISOString(),
          end_time: now.toISOString(),
          duration_sec: durationSec,
          aborted: false,
          focus_score: reviewData.focus_score,
          reason: reviewData.reason || '',
          note: reviewData.note || '',
          task: task?.task_name || 'Unknown Task',
          context_switch: false,
          pause_count: pauseCount,
        });
        
        console.log('Pomodoro review saved successfully - Duration:', durationSec, 'sec, Pauses:', pauseCount);
      }
    } catch (error) {
      console.error('Failed to save pomodoro:', error);
    }
  };

  // Day handlers
  const handleSaveDailyIntent = async (intentData) => {
    try {
      if (!dayData || !dayData.id) {
        console.error('No day data available');
        return;
      }

      console.log('Saving daily intent:', intentData);
      console.log('Day data:', dayData);

      // Update day with planned pomodoros (target_pomos in backend)
      const updatedDay = await api.updateDay(currentDate, {
        ...dayData,
        target_pomos: intentData.planned_pomodoros,
      });
      setDayData(updatedDay);
      console.log('Day updated:', updatedDay);

      // Create planned tasks
      if (intentData.tasks && intentData.tasks.length > 0) {
        const createdTasks = [];
        for (const taskData of intentData.tasks) {
          console.log('Creating task:', taskData);
          const newTask = await api.createTask(dayData.id, {
            task_name: taskData.name,
            planned_pomodoros: taskData.estimated_pomodoros,
            planned_at: new Date().toISOString(),
            pomodoros_spent: 0,
            completed: false,
          });
          console.log('Task created:', newTask);
          createdTasks.push(newTask);
        }
        setTasks(createdTasks);
        console.log('All tasks set:', createdTasks);
        
        // Auto-select first task
        if (createdTasks.length > 0) {
          setSelectedTaskId(createdTasks[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to save planning:', error);
      alert('Failed to save planning. Check console for details.');
    }
  };

  const handleSaveEndDay = async (reflectionData) => {
    try {
      const updatedDay = await api.updateDay(currentDate, {
        ...dayData,
        ...reflectionData,
      });
      setDayData(updatedDay);
    } catch (error) {
      console.error('Failed to save reflection:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-focus-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-time-red border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-focus-black text-white">
      {/* Header */}
      <header className="border-b border-focus-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Hardmode Pomo</h1>
              <div className="text-sm text-gray-400">
                {new Date(currentDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sync Status */}
              <div className={`flex items-center gap-2 text-sm ${
                isOnline ? 'text-focus-green' : 'text-gray-500'
              }`}>
                {isOnline ? <Cloud size={18} /> : <CloudOff size={18} />}
                <span>{isOnline ? 'Synced' : 'Offline'}</span>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowDailyIntent(true)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                <Calendar size={16} className="inline mr-2" />
                Plan Day
              </button>
              
              <button
                onClick={() => setShowEndDay(true)}
                className="btn-secondary px-4 py-2 text-sm"
              >
                <TrendingUp size={16} className="inline mr-2" />
                End Day
              </button>
            </div>
          </div>

          {/* Planned Pomodoros Display */}
          {dayData?.target_pomos > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 glass rounded-xl p-4 flex items-center justify-between"
            >
              <div className="text-sm text-gray-400">Today's Plan:</div>
              <div className="text-lg font-bold text-plan-blue">
                {dayData.target_pomos} Pomodoros
              </div>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <div className="mt-6 flex gap-2 border-b border-focus-border">
            <button
              onClick={() => setActiveTab('timer')}
              className={`px-6 py-3 flex items-center gap-2 transition-all ${
                activeTab === 'timer'
                  ? 'border-b-2 border-focus-blue text-focus-blue'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TimerIcon size={20} />
              <span>Timer</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 flex items-center gap-2 transition-all ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-focus-blue text-focus-blue'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'timer' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Timer */}
            <div className="flex items-center justify-center">
              <Timer
                onComplete={handlePomodoroComplete}
                taskId={selectedTaskId}
                selectedTask={tasks.find(t => t.id === selectedTaskId)}
              />
            </div>

            {/* Right: Tasks */}
            <div>
              <TaskList
                tasks={tasks}
                selectedTaskId={selectedTaskId}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onSelectTask={setSelectedTaskId}
              />
            </div>
          </div>
        ) : (
          <Analytics key={`analytics-${activeTab}`} currentDate={currentDate} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-focus-border mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Every second matters. Make them count.</p>
        </div>
      </footer>

      {/* Modals */}
      <DailyIntent
        isOpen={showDailyIntent}
        onClose={() => setShowDailyIntent(false)}
        onSave={handleSaveDailyIntent}
        initialData={dayData}
      />

      <EndDayDialog
        isOpen={showEndDay}
        onClose={() => setShowEndDay(false)}
        onSave={handleSaveEndDay}
        dayData={{ ...dayData, tasks }}
      />
    </div>
  );
}

export default App;
