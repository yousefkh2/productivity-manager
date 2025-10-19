import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Clock, Target, Zap } from 'lucide-react';

/**
 * Task List Component
 * Display and manage daily tasks with progress tracking
 * Tasks added via "+" button are marked with ⚡ (not part of daily plan)
 */
export default function TaskList({ tasks, onAddTask, onUpdateTask, onDeleteTask, onSelectTask, selectedTaskId, disabled = false }) {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskEstimate, setNewTaskEstimate] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      onAddTask({
        task_name: newTaskName.trim(),
        planned_pomodoros: newTaskEstimate,
        pomodoros_spent: 0,
        completed: false,
        planned_at: null, // Not planned, added mid-day
      });
      setNewTaskName('');
      setNewTaskEstimate(1);
      setIsAdding(false);
    }
  };

  const toggleComplete = (task) => {
    onUpdateTask(task.id, {
      ...task,
      completed: !task.completed,
    });
  };

  const calculateProgress = (task) => {
    const estimated = task.planned_pomodoros || 0;
    const completed = task.pomodoros_spent || 0;
    if (estimated === 0) return 0;
    return Math.min(100, (completed / estimated) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Today's Tasks</h2>
        {!disabled && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(!isAdding)}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all"
          >
            <Plus size={20} className={isAdding ? 'rotate-45 transition-transform' : ''} />
          </motion.button>
        )}
      </div>

      {/* Add Task Form */}
      <AnimatePresence>
        {isAdding && !disabled && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="glass rounded-xl p-4 space-y-3"
          >
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-focus-black/50 border border-focus-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-time-red"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Target size={18} className="text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newTaskEstimate}
                  onChange={(e) => setNewTaskEstimate(parseInt(e.target.value) || 1)}
                  className="w-20 bg-focus-black/50 border border-focus-border rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-time-red"
                />
                <span className="text-sm text-gray-400">pomodoros</span>
              </div>
              <button type="submit" className="btn-primary px-6 py-2">
                Add Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="space-y-3">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-gray-500"
            >
              <Target size={48} className="mx-auto mb-3 opacity-50" />
              <p>No tasks yet. Add one to get started!</p>
            </motion.div>
          ) : (
            tasks.map((task) => {
              const progress = calculateProgress(task);
              const isSelected = selectedTaskId === task.id;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  onClick={() => !disabled && onSelectTask(task.id)}
                  className={`glass rounded-xl p-4 transition-all ${
                    disabled ? 'cursor-default' : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'ring-2 ring-time-red'
                      : disabled ? '' : 'hover:bg-white/10'
                  } ${task.is_completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <motion.button
                      whileHover={disabled ? {} : { scale: 1.1 }}
                      whileTap={disabled ? {} : { scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!disabled) toggleComplete(task);
                      }}
                      disabled={disabled}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? 'bg-focus-green border-focus-green'
                          : 'border-focus-border hover:border-focus-green'
                      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      {task.completed && <Check size={16} />}
                    </motion.button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`font-medium flex-1 ${
                          task.completed ? 'line-through text-gray-500' : ''
                        }`}>
                          {task.task_name}
                        </h3>
                        {/* Lightning icon for unplanned tasks */}
                        {!task.planned_at && (
                          <div className="flex items-center gap-1 text-xs text-yellow-500" title="Added mid-day (not part of plan)">
                            <Zap size={14} className="fill-yellow-500" />
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="h-2 bg-focus-gray rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${
                              task.completed
                                ? 'bg-focus-green'
                                : progress >= 100
                                ? 'bg-insight-purple'
                                : 'bg-time-red'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{task.pomodoros_spent} / {task.planned_pomodoros}</span>
                        </div>
                        {progress >= 100 && !task.completed && (
                          <span className="text-insight-purple font-medium">
                            Target exceeded! 🎯
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    {!disabled && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        className="text-gray-500 hover:text-time-red transition-colors"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Summary Stats */}
      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-xl p-4 flex items-center justify-around text-center"
        >
          <div>
            <div className="text-2xl font-bold text-time-red">
              {tasks.filter(t => !t.completed).length}
            </div>
            <div className="text-xs text-gray-400">Active</div>
          </div>
          <div className="w-px h-10 bg-focus-border" />
          <div>
            <div className="text-2xl font-bold text-focus-green">
              {tasks.filter(t => t.completed).length}
            </div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="w-px h-10 bg-focus-border" />
          <div>
            <div className="text-2xl font-bold text-plan-blue">
              {tasks.reduce((sum, t) => sum + (t.pomodoros_spent || 0), 0)}
            </div>
            <div className="text-xs text-gray-400">Pomodoros</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
