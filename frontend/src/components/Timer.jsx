import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Maximize2, Minimize2, Settings } from 'lucide-react';
import PipTimer from './PipTimer';
import PomodoroReview from './PomodoroReview';

/**
 * Circular Progress Timer Component
 * 25 minutes Pomodoro with smooth animations
 * Side button icons: 36px (large and visible)
 */
export default function Timer({ onComplete, taskId, selectedTask, disabled = false, onTimerStateChange }) {
  // TESTING MODE: 10 seconds for focus, 5 seconds for break
  const FOCUS_TIME = 25 * 60; // Change to 25 * 60 for production (25 minutes)
  const BREAK_TIME = 5 * 60;  // Change to 5 * 60 for production (5 minutes)
  
  // Load persisted timer state from localStorage
  const loadTimerState = () => {
    try {
      const saved = localStorage.getItem('timerState');
      if (saved) {
        const state = JSON.parse(saved);
        // Only restore if the state is recent (within last 2 hours)
        const stateAge = Date.now() - (state.timestamp || 0);
        if (stateAge < 2 * 60 * 60 * 1000) {
          // If timer was running, adjust timeLeft based on elapsed time
          if (state.isRunning && state.timeLeft > 0) {
            const elapsedSeconds = Math.floor(stateAge / 1000);
            const adjustedTimeLeft = Math.max(0, state.timeLeft - elapsedSeconds);
            return {
              ...state,
              timeLeft: adjustedTimeLeft,
              // If time ran out while away, mark as not running
              isRunning: adjustedTimeLeft > 0,
            };
          }
          return state;
        }
      }
    } catch (e) {
      console.error('Failed to load timer state:', e);
    }
    return null;
  };

  const savedState = loadTimerState();

  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft || FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(savedState?.isRunning || false); // Restore running state
  const [mode, setMode] = useState(savedState?.mode || 'focus');
  const [isPipActive, setIsPipActive] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [currentLayout, setCurrentLayout] = useState(() => {
    return localStorage.getItem('pipLayout') || 'default';
  });
  const [showReview, setShowReview] = useState(false);
  const [pauseCount, setPauseCount] = useState(savedState?.pauseCount || 0);
  const intervalRef = useRef(null);
  const pipTimerRef = useRef(null);

  const totalTime = mode === 'focus' ? FOCUS_TIME : BREAK_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  // Notify parent about timer state changes
  useEffect(() => {
    if (onTimerStateChange) {
      onTimerStateChange({
        isRunning,
        timeLeft,
        totalTime,
        mode,
        pauseCount,
      });
    }
  }, [isRunning, timeLeft, mode, pauseCount, onTimerStateChange]);

  // Handle task switching mid-session (abort logic)
  const previousTaskIdRef = useRef(taskId);
  useEffect(() => {
    // Only abort if we're switching tasks, not on initial mount
    if (previousTaskIdRef.current && taskId !== previousTaskIdRef.current) {
      // Task switched during active pomodoro
      if (isRunning && mode === 'focus') {
        console.log('Task switched mid-pomodoro - aborting current session');
        // Stop timer and increment pause count as penalty
        setIsRunning(false);
        setPauseCount(prev => prev + 1);
        // Reset to beginning (don't save the partial pomo)
        setTimeLeft(FOCUS_TIME);
      }
    }
    previousTaskIdRef.current = taskId;
  }, [taskId, isRunning, mode]);

  // Persist timer state to localStorage whenever it changes
  useEffect(() => {
    const timerState = {
      timeLeft,
      isRunning,
      mode,
      pauseCount,
      timestamp: Date.now(),
    };
    localStorage.setItem('timerState', JSON.stringify(timerState));
  }, [timeLeft, isRunning, mode, pauseCount]);

  // Debug: Log when showReview changes
  useEffect(() => {
    console.log('showReview state changed:', showReview);
  }, [showReview]);

  // Stop timer when disabled (day is complete)
  useEffect(() => {
    if (disabled && isRunning) {
      setIsRunning(false);
    }
  }, [disabled]);

  // Check if timer completed while page was closed/refreshed
  useEffect(() => {
    // Only run once on mount
    if (savedState && savedState.isRunning && timeLeft === 0) {
      // Timer completed while page was closed
      console.log('Timer completed while page was closed - triggering completion');
      handleComplete();
    }
  }, []); // Empty deps = run once on mount

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleComplete = () => {
    setIsRunning(false);
    
    // Play notification sound and show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Pomodoro Complete! 🍅', {
        body: mode === 'focus' 
          ? `Great work on "${selectedTask?.task_name || 'your task'}"! Time for a break.` 
          : 'Break over! Ready to focus?',
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: 'pomodoro-timer',
        requireInteraction: true, // Notification stays until user dismisses
      });

      // Play a sound (browser beep)
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } else if ('Notification' in window) {
      // Try to request permission if not yet granted
      Notification.requestPermission();
    }

    // Show review dialog for focus sessions (don't call onComplete yet)
    if (mode === 'focus') {
      setShowReview(true);
      setMode('break');
      setTimeLeft(BREAK_TIME);
      // Don't reset pauseCount yet - we'll reset it after review is saved
    } else {
      // Break complete - just switch back to focus
      setMode('focus');
      setTimeLeft(FOCUS_TIME);
      setPauseCount(0); // Reset pause count for next focus session
    }
  };

  const handleReviewSave = async (reviewData) => {
    console.log('Review saved:', reviewData, 'Pauses:', pauseCount);
    // Pass review data, actual duration, and pause count to parent
    if (onComplete) {
      await onComplete(taskId, reviewData, FOCUS_TIME, pauseCount);
    }
    setShowReview(false);
    setPauseCount(0); // Reset pause count after saving
    localStorage.removeItem('timerState'); // Clear persisted state after completing
  };

  const handleReviewSkip = () => {
    console.log('Review skipped, Pauses:', pauseCount);
    // Still increment the task's pomodoro count (no review data, but pass duration and pauses)
    if (onComplete) {
      onComplete(taskId, null, FOCUS_TIME, pauseCount);
    }
    setShowReview(false);
    setPauseCount(0); // Reset pause count
    localStorage.removeItem('timerState'); // Clear persisted state
  };

  const toggleTimer = () => {
    // Require task selection for focus mode
    if (!isRunning && mode === 'focus' && !taskId) {
      alert('⚠️ Please select a task before starting a Pomodoro session.');
      return;
    }

    // If we're pausing (timer is running and we're stopping it)
    if (isRunning && mode === 'focus') {
      setPauseCount(prev => prev + 1);
      console.log('Paused! Total pauses:', pauseCount + 1);
    }

    setIsRunning(!isRunning);

    // Request notification permission on first start
    if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? FOCUS_TIME : BREAK_TIME);
    setPauseCount(0); // Reset pause count on reset
    // Clear persisted state
    localStorage.removeItem('timerState');
  };

  const switchMode = () => {
    setIsRunning(false);
    const newMode = mode === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? FOCUS_TIME : BREAK_TIME);
    setPauseCount(0); // Reset pause count when manually switching modes
    // Clear persisted state since we're starting fresh
    localStorage.removeItem('timerState');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePipToggle = () => {
    // Access the PipTimer's toggle function
    const pipButton = document.querySelector('[data-pip-toggle]');
    if (pipButton && pipButton.__pipToggle) {
      pipButton.__pipToggle();
    }
  };

  const handleLayoutChange = (newLayout) => {
    setCurrentLayout(newLayout);
    setShowLayoutMenu(false);
    
    // Access the PipTimer's layout change function
    const pipButton = document.querySelector('[data-pip-toggle]');
    if (pipButton && pipButton.__changeLayout) {
      pipButton.__changeLayout(newLayout);
    }
  };

  const circumference = 2 * Math.PI * 140; // radius = 140

  // Note: Browsers enforce minimum PiP dimensions (~100px height minimum)
  const LAYOUT_OPTIONS = [
    { id: 'default', name: 'Default (Square)', desc: '640×480 - Full details' },
    { id: 'taskbar', name: 'Taskbar Strip', desc: '800×120 - Horizontal bar' },
    { id: 'compact', name: 'Compact', desc: '400×300 - Small square' },
    { id: 'minimal', name: 'Minimal', desc: '600×100 - Ultra-thin bar' },
  ];

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Selected Task Display */}
      {selectedTask && mode === 'focus' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-6 py-3 glass rounded-xl max-w-md"
        >
          <div className="text-xs text-gray-400 mb-1">Working on:</div>
          <div className="font-medium text-lg">{selectedTask.task_name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Pomodoro {(selectedTask.pomodoros_spent || 0) + 1} of {selectedTask.planned_pomodoros || 1}
          </div>
        </motion.div>
      )}

      {/* Mode Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`px-4 py-2 rounded-full text-sm font-medium ${
          mode === 'focus'
            ? 'bg-time-red/10 text-time-red'
            : 'bg-focus-green/10 text-focus-green'
        }`}
      >
        {mode === 'focus' ? '🎯 FOCUS MODE' : '☕ BREAK TIME'}
      </motion.div>

      {/* Circular Timer */}
      <div className="relative">
        {/* Background circle */}
        <svg width="320" height="320" className="transform -rotate-90">
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-focus-gray"
          />
          {/* Progress circle */}
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${mode === 'focus' ? 'text-time-red' : 'text-focus-green'}`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference - (progress / 100) * circumference,
            }}
          />
        </svg>

        {/* Time Display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1 }}
            animate={{ scale: isRunning && timeLeft % 60 === 0 ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.3 }}
            className={`text-7xl font-mono font-bold timer-glow ${
              mode === 'focus' ? 'text-time-red' : 'text-focus-green'
            }`}
          >
            {formatTime(timeLeft)}
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 relative">
        <motion.button
          whileHover={disabled ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          onClick={disabled ? undefined : toggleTimer}
          disabled={disabled}
          className={`btn-primary w-32 h-14 flex items-center justify-center gap-2 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isRunning ? (
            <>
              <Pause size={24} />
              Pause
            </>
          ) : (
            <>
              <Play size={24} />
              Start
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={disabled ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          onClick={disabled ? undefined : resetTimer}
          disabled={disabled}
          className={`w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all p-0 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Reset Timer"
        >
          <RotateCcw size={24} strokeWidth={2} />
        </motion.button>

        <motion.button
          whileHover={disabled ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          onClick={disabled ? undefined : switchMode}
          disabled={disabled}
          className={`w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all p-0 ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Switch Mode"
        >
          <Coffee size={24} strokeWidth={2} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePipToggle}
          className={`w-14 h-14 flex items-center justify-center border border-white/10 rounded-lg transition-all p-0 ${
            isPipActive ? 'bg-time-red hover:bg-time-red/90' : 'bg-white/10 hover:bg-white/20'
          }`}
          title={isPipActive ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
        >
          {isPipActive ? <Minimize2 size={24} strokeWidth={2} /> : <Maximize2 size={24} strokeWidth={2} />}
        </motion.button>

        {/* PiP Layout Settings */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            className="w-14 h-14 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all p-0"
            title="PiP Layout Settings"
          >
            <Settings size={24} strokeWidth={2} />
          </motion.button>

          {/* Layout Selection Menu */}
          <AnimatePresence>
            {showLayoutMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-2 glass rounded-xl p-3 min-w-[280px] z-50 shadow-xl"
              >
                <div className="text-xs text-gray-400 mb-2 font-semibold">PiP LAYOUT</div>
                <div className="space-y-1">
                  {LAYOUT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleLayoutChange(option.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                        currentLayout === option.id
                          ? 'bg-time-red text-white'
                          : 'hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{option.name}</div>
                      <div className="text-xs opacity-75">{option.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-focus-border text-xs text-gray-500">
                  💡 Tip: Try "Taskbar Strip" to place it on your taskbar!
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm text-gray-400 text-center max-w-md"
      >
        {!taskId && mode === 'focus' && !isRunning ? (
          <span className="text-time-red">⚠️ Select a task to start a Pomodoro session</span>
        ) : isRunning ? (
          mode === 'focus' ? (
            'Stay focused. Every second matters.'
          ) : (
            'Recharge. You earned this break.'
          )
        ) : (
          'Press START when ready to begin.'
        )}
      </motion.p>

      {/* Picture-in-Picture Component */}
      <PipTimer
        timeLeft={timeLeft}
        isRunning={isRunning}
        mode={mode}
        selectedTask={selectedTask}
        isPipActive={isPipActive}
        onPipToggle={setIsPipActive}
        layout={currentLayout}
        ref={pipTimerRef}
      />

      {/* Post-Session Review Dialog */}
      <PomodoroReview
        isOpen={showReview}
        onClose={handleReviewSkip}
        onSave={handleReviewSave}
        taskName={selectedTask?.task_name || 'Unknown Task'}
      />
    </div>
  );
}
