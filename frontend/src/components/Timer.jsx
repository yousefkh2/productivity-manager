import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Coffee, Maximize2, Minimize2 } from 'lucide-react';
import PipTimer from './PipTimer';

/**
 * Circular Progress Timer Component
 * 25 minutes Pomodoro with smooth animations
 */
export default function Timer({ onComplete, taskId, selectedTask }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('focus'); // 'focus' | 'break'
  const [isPipActive, setIsPipActive] = useState(false);
  const intervalRef = useRef(null);
  const pipTimerRef = useRef(null);

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

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

    if (mode === 'focus' && onComplete) {
      onComplete(taskId);
    }

    // Auto-switch mode
    if (mode === 'focus') {
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('focus');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    // Require task selection for focus mode
    if (!isRunning && mode === 'focus' && !taskId) {
      alert('⚠️ Please select a task before starting a Pomodoro session.');
      return;
    }

    setIsRunning(!isRunning);

    // Request notification permission on first start
    if (!isRunning && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = () => {
    setIsRunning(false);
    const newMode = mode === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
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

  const circumference = 2 * Math.PI * 140; // radius = 140

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
          <motion.circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            className={mode === 'focus' ? 'text-time-red' : 'text-focus-green'}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: circumference - (progress / 100) * circumference,
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference - (progress / 100) * circumference,
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
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
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className="btn-primary w-32 h-14 flex items-center justify-center gap-2"
        >
          {isRunning ? (
            <>
              <Pause size={20} />
              Pause
            </>
          ) : (
            <>
              <Play size={20} />
              Start
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetTimer}
          className="btn-secondary w-14 h-14 flex items-center justify-center"
          title="Reset Timer"
        >
          <RotateCcw size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={switchMode}
          className="btn-secondary w-14 h-14 flex items-center justify-center"
          title="Switch Mode"
        >
          <Coffee size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePipToggle}
          className={`w-14 h-14 flex items-center justify-center ${
            isPipActive ? 'btn-primary' : 'btn-secondary'
          }`}
          title={isPipActive ? 'Exit Picture-in-Picture' : 'Enter Picture-in-Picture'}
        >
          {isPipActive ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </motion.button>
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
      />
    </div>
  );
}
