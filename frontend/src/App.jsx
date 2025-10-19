import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, CloudOff, Calendar, TrendingUp, BarChart3, Timer as TimerIcon, Moon, Gift } from 'lucide-react';
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

      // Update day with planned pomodoros and reward
      const updatedDay = await api.updateDay(currentDate, {
        ...dayData,
        target_pomos: intentData.planned_pomodoros,
        reward: intentData.reward || '',
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
      if (!dayData || !dayData.id) {
        console.error('No day data available');
        return;
      }

      // Map frontend fields to backend fields
      const backendData = {
        day_rating: reflectionData.satisfaction,
        reflection_notes: reflectionData.reflection,
        main_distraction: '', // Could add this field to the dialog later
      };

      await api.updateDayReflection(dayData.id, backendData);
      
      // Reload the day data to get the updated reflection
      const updatedDay = await api.getDayByDate(currentDate);
      setDayData(updatedDay);
      
      // Show success message
      alert('✓ Day reflection saved! Great work today. 🌙');
    } catch (error) {
      console.error('Failed to save reflection:', error);
      alert('Failed to save reflection. Please try again.');
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
              {/* Day Completed Badge */}
              {dayData?.day_rating && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-insight-purple/20 border border-insight-purple/30">
                  <Moon size={14} className="text-insight-purple" />
                  <span className="text-xs font-medium text-insight-purple">Day Complete</span>
                </div>
              )}
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
                disabled={tasks.length > 0 || (dayData?.target_pomos > 0) || dayData?.day_rating}
                className={`px-4 py-2 text-sm transition-all ${
                  tasks.length > 0 || (dayData?.target_pomos > 0) || dayData?.day_rating
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                    : 'btn-secondary hover:bg-white/20'
                }`}
                title={
                  dayData?.day_rating
                    ? 'Day is complete and archived.'
                    : tasks.length > 0 || (dayData?.target_pomos > 0)
                    ? 'Day already planned. Add tasks manually if needed.'
                    : 'Plan your day and add tasks'
                }
              >
                <Calendar size={16} className="inline mr-2" />
                {tasks.length > 0 || (dayData?.target_pomos > 0) ? 'Day Planned ✓' : 'Plan Day'}
              </button>
              
              <button
                onClick={() => setShowEndDay(true)}
                className={`px-4 py-2 text-sm transition-all ${
                  dayData?.day_rating 
                    ? 'bg-insight-purple/20 text-insight-purple border border-insight-purple/30' 
                    : 'btn-secondary hover:bg-white/20'
                }`}
              >
                {dayData?.day_rating ? (
                  <>
                    <Moon size={16} className="inline mr-2" />
                    View Reflection
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} className="inline mr-2" />
                    End Day
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Daily Progress Banner */}
          {dayData?.target_pomos > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 glass rounded-xl p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-400">Today's Plan</div>
                  <div className="text-2xl font-bold text-plan-blue">
                    {dayData.target_pomos} Pomodoros
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Estimated Finish</div>
                  <div className="text-xl font-semibold text-white">
                    {(() => {
                      // Calculate finish time based on target pomodoros
                      const now = new Date();
                      const pomos = dayData.target_pomos;
                      
                      // Each pomodoro: 25min work + 5min break = 30min
                      // Every 4 pomodoros: add 15min long break instead of 5min
                      const shortBreaks = Math.floor((pomos - 1) / 4) * 3 + (pomos - 1) % 4;
                      const longBreaks = Math.floor((pomos - 1) / 4);
                      const lunchBreak = pomos >= 8 ? 30 : 0;
                      
                      const totalMinutes = (pomos * 25) + (shortBreaks * 5) + (longBreaks * 15) + lunchBreak;
                      
                      const finishTime = new Date(now);
                      finishTime.setMinutes(now.getMinutes() + totalMinutes);
                      
                      return finishTime.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Dual Progress Visualization */}
              <div className="space-y-3">
                {/* Time Progress (background - shows time passing) */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Time Progress</span>
                    <span>
                      {(() => {
                        const now = new Date();
                        const startOfDay = new Date(now);
                        startOfDay.setHours(9, 0, 0, 0); // Assume 9 AM start
                        
                        const pomos = dayData.target_pomos;
                        const shortBreaks = Math.floor((pomos - 1) / 4) * 3 + (pomos - 1) % 4;
                        const longBreaks = Math.floor((pomos - 1) / 4);
                        const lunchBreak = pomos >= 8 ? 30 : 0;
                        const totalMinutes = (pomos * 25) + (shortBreaks * 5) + (longBreaks * 15) + lunchBreak;
                        
                        const elapsed = (now - startOfDay) / (1000 * 60); // minutes elapsed
                        const timeProgress = Math.min(100, Math.max(0, (elapsed / totalMinutes) * 100));
                        
                        return `${Math.round(timeProgress)}%`;
                      })()}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${(() => {
                          const now = new Date();
                          const startOfDay = new Date(now);
                          startOfDay.setHours(9, 0, 0, 0);
                          
                          const pomos = dayData.target_pomos;
                          const shortBreaks = Math.floor((pomos - 1) / 4) * 3 + (pomos - 1) % 4;
                          const longBreaks = Math.floor((pomos - 1) / 4);
                          const lunchBreak = pomos >= 8 ? 30 : 0;
                          const totalMinutes = (pomos * 25) + (shortBreaks * 5) + (longBreaks * 15) + lunchBreak;
                          
                          const elapsed = (now - startOfDay) / (1000 * 60);
                          const timeProgress = Math.min(100, Math.max(0, (elapsed / totalMinutes) * 100));
                          
                          return timeProgress;
                        })()}%` 
                      }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-gray-600 to-gray-500"
                    />
                  </div>
                </div>

                {/* Work Progress (foreground - shows pomodoros completed) */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Work Progress</span>
                    <span>
                      {tasks.reduce((sum, t) => sum + (t.pomodoros_spent || 0), 0)} / {dayData.target_pomos} Pomodoros
                    </span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
                    {/* Pomodoro progress */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${((tasks.reduce((sum, t) => sum + (t.pomodoros_spent || 0), 0) / dayData.target_pomos) * 100)}%` 
                      }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${
                        (() => {
                          const completedPomos = tasks.reduce((sum, t) => sum + (t.pomodoros_spent || 0), 0);
                          const targetPomos = dayData.target_pomos;
                          const now = new Date();
                          const startOfDay = new Date(now);
                          startOfDay.setHours(9, 0, 0, 0);
                          
                          const pomos = targetPomos;
                          const shortBreaks = Math.floor((pomos - 1) / 4) * 3 + (pomos - 1) % 4;
                          const longBreaks = Math.floor((pomos - 1) / 4);
                          const lunchBreak = pomos >= 8 ? 30 : 0;
                          const totalMinutes = (pomos * 25) + (shortBreaks * 5) + (longBreaks * 15) + lunchBreak;
                          
                          const elapsed = (now - startOfDay) / (1000 * 60);
                          const timeProgress = Math.min(100, Math.max(0, (elapsed / totalMinutes) * 100));
                          const workProgress = (completedPomos / targetPomos) * 100;
                          
                          // If work progress is keeping up with or ahead of time, show green
                          // If falling behind, show yellow or red
                          if (workProgress >= timeProgress || timeProgress < 5) {
                            return 'bg-gradient-to-r from-focus-green to-green-400';
                          } else if (workProgress >= timeProgress * 0.75) {
                            return 'bg-gradient-to-r from-yellow-500 to-yellow-400';
                          } else {
                            return 'bg-gradient-to-r from-time-red to-red-400';
                          }
                        })()
                      }`}
                    />
                  </div>
                </div>

                {/* Status Message */}
                <div className="text-xs text-center mt-2">
                  {(() => {
                    const completedPomos = tasks.reduce((sum, t) => sum + (t.pomodoros_spent || 0), 0);
                    const targetPomos = dayData.target_pomos;
                    const now = new Date();
                    const startOfDay = new Date(now);
                    startOfDay.setHours(9, 0, 0, 0);
                    
                    const pomos = targetPomos;
                    const shortBreaks = Math.floor((pomos - 1) / 4) * 3 + (pomos - 1) % 4;
                    const longBreaks = Math.floor((pomos - 1) / 4);
                    const lunchBreak = pomos >= 8 ? 30 : 0;
                    const totalMinutes = (pomos * 25) + (shortBreaks * 5) + (longBreaks * 15) + lunchBreak;
                    
                    const elapsed = (now - startOfDay) / (1000 * 60);
                    const timeProgress = Math.min(100, Math.max(0, (elapsed / totalMinutes) * 100));
                    const workProgress = (completedPomos / targetPomos) * 100;
                    
                    if (completedPomos === 0 && timeProgress > 10) {
                      return <span className="text-time-red font-semibold">⚠️ Time is passing! Start working to stay on track.</span>;
                    } else if (workProgress >= timeProgress || timeProgress < 5) {
                      return <span className="text-focus-green">✓ You're on pace or ahead of schedule!</span>;
                    } else if (workProgress >= timeProgress * 0.75) {
                      return <span className="text-yellow-400">⏱️ Slightly behind schedule, but recoverable.</span>;
                    } else {
                      return <span className="text-time-red">⚠️ Falling behind! Focus up to get back on track.</span>;
                    }
                  })()}
                </div>

                {/* Reward Display */}
                {dayData.reward && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 glass rounded-xl p-4 bg-gradient-to-r from-focus-green/10 to-plan-blue/10 border border-focus-green/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-focus-green/20 flex items-center justify-center flex-shrink-0">
                        <Gift size={20} className="text-focus-green" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-400 mb-1">Your Reward</div>
                        <div className="text-sm font-medium text-white">{dayData.reward}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {tasks.reduce((sum, t) => sum + (t.pomodoros_spent || 0), 0) >= dayData.target_pomos ? (
                          <span className="text-focus-green font-semibold">🎉 Unlocked!</span>
                        ) : (
                          <span>
                            {dayData.target_pomos - tasks.reduce((sum, t) => sum + (t.pomodoros_spent || 0), 0)} more to go
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
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
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Timer */}
              <div className="flex items-center justify-center">
                <Timer
                  onComplete={handlePomodoroComplete}
                  taskId={selectedTaskId}
                  selectedTask={tasks.find(t => t.id === selectedTaskId)}
                  disabled={!!dayData?.day_rating}
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
                  disabled={!!dayData?.day_rating}
                />
              </div>
            </div>

            {/* Day Complete Overlay */}
            {dayData?.day_rating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center pointer-events-none"
              >
                <div className="text-center space-y-4 pointer-events-auto">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-block"
                  >
                    <div className="w-20 h-20 rounded-full bg-insight-purple/20 border-2 border-insight-purple flex items-center justify-center mb-4">
                      <Moon size={40} className="text-insight-purple" />
                    </div>
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white">Day Archived</h3>
                  <p className="text-gray-300 max-w-md mx-auto">
                    You've completed your reflection for this day. <br />
                    Work is locked to preserve your record.
                  </p>
                  <div className="flex gap-3 justify-center pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEndDay(true)}
                      className="px-6 py-3 rounded-xl bg-insight-purple/20 border border-insight-purple text-insight-purple hover:bg-insight-purple/30 transition-colors"
                    >
                      View Reflection
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('analytics')}
                      className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                    >
                      View Analytics
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
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
