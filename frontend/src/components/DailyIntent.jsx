import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sunrise, Target, X, Clock, Plus, Trash2, Gift } from 'lucide-react';

/**
 * Daily Planning Modal
 * Step 1: How many pomodoros? (with finish time estimate)
 * Step 2: Which tasks will you work on?
 * Step 3: What's your reward for completing?
 */
export default function DailyIntent({ isOpen, onClose, onSave, initialData }) {
  const [step, setStep] = useState(1);
  const [plannedPomodoros, setPlannedPomodoros] = useState(initialData?.planned_pomodoros || 8);
  const [tasks, setTasks] = useState(initialData?.tasks || []);
  const [reward, setReward] = useState(initialData?.reward || '');
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState(1);

  // Calculate finish time based on pomodoros
  const calculateFinishTime = (pomos) => {
    const now = new Date();
    const startHour = now.getHours();
    const startMinute = now.getMinutes();
    
    // Each pomodoro: 25min work + 5min break = 30min
    // Every 4 pomodoros: add 15min long break instead of 5min
    const shortBreaks = Math.floor((pomos - 1) / 4) * 3 + (pomos - 1) % 4;
    const longBreaks = Math.floor((pomos - 1) / 4);
    const lunchBreak = pomos >= 8 ? 30 : 0; // 30min lunch if 8+ pomodoros
    
    const totalMinutes = (pomos * 25) + (shortBreaks * 5) + (longBreaks * 15) + lunchBreak;
    
    const finishTime = new Date();
    finishTime.setHours(startHour);
    finishTime.setMinutes(startMinute + totalMinutes);
    
    return finishTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      setTasks([...tasks, {
        name: newTaskName.trim(),
        estimated_pomodoros: newTaskEstimate,
        is_planned: true, // Mark as part of daily plan
      }]);
      setNewTaskName('');
      setNewTaskEstimate(1);
    }
  };

  const handleRemoveTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newTaskName.trim()) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleStep1Next = () => {
    if (plannedPomodoros > 0) {
      setStep(2);
    }
  };

  const handleStep2Next = () => {
    setStep(3);
  };

  const handleSubmit = () => {
    onSave({
      planned_pomodoros: plannedPomodoros,
      tasks: tasks,
      reward: reward.trim(),
    });
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const totalEstimatedPomos = tasks.reduce((sum, t) => sum + t.estimated_pomodoros, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="glass rounded-2xl p-8 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </motion.button>

              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-block mb-4"
                >
                  <div className="w-16 h-16 rounded-full bg-plan-blue/20 flex items-center justify-center">
                    <Sunrise size={32} className="text-plan-blue" />
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Plan Your Day</h2>
                <p className="text-gray-400">
                  {step === 1 
                    ? 'How many pomodoros are you planning?' 
                    : step === 2 
                    ? 'Which tasks will you work on?' 
                    : 'What will you reward yourself with?'}
                </p>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step === 1 ? 'bg-plan-blue text-white' : step > 1 ? 'bg-focus-green text-white' : 'bg-focus-gray text-gray-400'
                }`}>
                  1
                </div>
                <div className="w-12 h-0.5 bg-focus-border"></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step === 2 ? 'bg-plan-blue text-white' : step > 2 ? 'bg-focus-green text-white' : 'bg-focus-gray text-gray-400'
                }`}>
                  2
                </div>
                <div className="w-12 h-0.5 bg-focus-border"></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step === 3 ? 'bg-plan-blue text-white' : 'bg-focus-gray text-gray-400'
                }`}>
                  3
                </div>
              </div>

              {/* Step 1: Pomodoro Count */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <label className="block text-lg font-medium mb-6">
                      How many pomodoros are you planning for today?
                    </label>
                    
                    {/* Pomodoro Counter */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPlannedPomodoros(Math.max(1, plannedPomodoros - 1))}
                        className="w-12 h-12 rounded-full bg-focus-gray hover:bg-focus-border text-2xl font-bold"
                      >
                        −
                      </motion.button>
                      
                      <div className="w-32 text-center">
                        <div className="text-6xl font-bold text-plan-blue font-mono">
                          {plannedPomodoros}
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setPlannedPomodoros(Math.min(20, plannedPomodoros + 1))}
                        className="w-12 h-12 rounded-full bg-focus-gray hover:bg-focus-border text-2xl font-bold"
                      >
                        +
                      </motion.button>
                    </div>

                    {/* Finish Time Estimate */}
                    <div className="glass rounded-xl p-4 inline-block">
                      <div className="flex items-center gap-2 text-focus-green">
                        <Clock size={20} />
                        <span className="font-medium">
                          You'll finish by: {calculateFinishTime(plannedPomodoros)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        (Assuming you start now{plannedPomodoros >= 8 ? ' + 30min lunch break' : ''})
                      </div>
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex gap-2 justify-center flex-wrap">
                    {[4, 8, 12, 16].map((num) => (
                      <motion.button
                        key={num}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPlannedPomodoros(num)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          plannedPomodoros === num
                            ? 'bg-plan-blue text-white'
                            : 'bg-focus-gray hover:bg-focus-border'
                        }`}
                      >
                        {num} pomodoros
                      </motion.button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleSkip}
                      className="flex-1 py-3 rounded-xl border border-focus-border hover:bg-white/5 transition-colors"
                    >
                      Skip Planning
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStep1Next}
                      className="flex-1 btn-primary py-3"
                    >
                      Next: Plan Tasks →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Task Planning */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-lg font-medium mb-4">
                      Which tasks will you work on today?
                    </label>

                    {/* Add Task Form */}
                    <div className="glass rounded-xl p-4 mb-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Task name..."
                          className="flex-1 bg-focus-black/50 border border-focus-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-plan-blue"
                          autoFocus
                        />
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={newTaskEstimate}
                          onChange={(e) => setNewTaskEstimate(parseInt(e.target.value) || 1)}
                          className="w-20 bg-focus-black/50 border border-focus-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-plan-blue text-center"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddTask}
                          className="btn-primary px-4 py-2"
                        >
                          <Plus size={20} />
                        </motion.button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Enter task name and estimated pomodoros, then press Enter or click +
                      </p>
                    </div>

                    {/* Task List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Target size={48} className="mx-auto mb-3 opacity-50" />
                          <p>No tasks added yet. Add your first task above!</p>
                        </div>
                      ) : (
                        tasks.map((task, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="glass rounded-lg p-3 flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{task.name}</div>
                              <div className="text-xs text-gray-400">
                                {task.estimated_pomodoros} pomodoro{task.estimated_pomodoros !== 1 ? 's' : ''}
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveTask(index)}
                              className="text-gray-500 hover:text-time-red transition-colors"
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {/* Summary */}
                    {tasks.length > 0 && (
                      <div className="glass rounded-xl p-4 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total estimated pomodoros:</span>
                          <span className={`text-2xl font-bold font-mono ${
                            totalEstimatedPomos > plannedPomodoros ? 'text-time-red' : 'text-focus-green'
                          }`}>
                            {totalEstimatedPomos} / {plannedPomodoros}
                          </span>
                        </div>
                        {totalEstimatedPomos > plannedPomodoros && (
                          <p className="text-xs text-time-red mt-2">
                            ⚠️ Your tasks exceed planned pomodoros. Consider adjusting.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(1)}
                      className="px-6 py-3 rounded-xl border border-focus-border hover:bg-white/5 transition-colors"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSkip}
                      className="flex-1 py-3 rounded-xl border border-focus-border hover:bg-white/5 transition-colors"
                    >
                      Skip Planning
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStep2Next}
                      disabled={tasks.length === 0}
                      className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Set Reward →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Reward */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-lg font-medium mb-2 flex items-center gap-2">
                      <Gift size={24} className="text-focus-green" />
                      Your Reward
                    </label>
                    <p className="text-gray-400 text-sm mb-6">
                      What's something you'll enjoy guilt-free once you finish your pomodoros?
                      <br />
                      <span className="text-xs">(It can be small but specific.)</span>
                    </p>

                    {/* Reward Input */}
                    <textarea
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      placeholder="Watch one episode of Dark 🍿&#10;Read Atomic Habits for 30 min 📖&#10;Take a long walk with music 🎧&#10;Call my friend ☎️"
                      className="w-full bg-focus-black/50 border border-focus-border rounded-xl px-4 py-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-focus-green"
                      autoFocus
                    />

                    {/* Unlock Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4 glass rounded-xl p-4 bg-gradient-to-r from-focus-green/10 to-plan-blue/10 border border-focus-green/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-focus-green/20 flex items-center justify-center flex-shrink-0">
                          <Clock size={24} className="text-focus-green" />
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            You'll unlock this once you hit {plannedPomodoros} pomodoro{plannedPomodoros !== 1 ? 's' : ''}.
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Your commitment to yourself. Make it happen! 💪
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Quick Examples */}
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Quick ideas:</p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          'Watch one episode 🍿',
                          'Read for 30 min 📖',
                          'Long walk 🎧',
                          'Gaming session 🎮',
                          'Favorite snack 🍫',
                        ].map((example) => (
                          <motion.button
                            key={example}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setReward(example)}
                            className="px-3 py-1 rounded-lg bg-focus-gray hover:bg-focus-border text-xs transition-colors"
                          >
                            {example}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(2)}
                      className="px-6 py-3 rounded-xl border border-focus-border hover:bg-white/5 transition-colors"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      className="flex-1 py-3 rounded-xl border border-focus-border hover:bg-white/5 transition-colors"
                    >
                      Skip Reward
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      className="flex-1 btn-primary py-3"
                    >
                      Start Day! 🚀
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
