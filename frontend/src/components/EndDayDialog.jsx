import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Star, TrendingUp, X } from 'lucide-react';

/**
 * End Day Dialog
 * Evening reflection: rate satisfaction and capture learnings
 */
export default function EndDayDialog({ isOpen, onClose, onSave, dayData }) {
  const [satisfaction, setSatisfaction] = useState(dayData?.satisfaction || 5);
  const [reflection, setReflection] = useState(dayData?.reflection || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      satisfaction,
      reflection: reflection.trim(),
    });
    onClose();
  };

  const totalPomodoros = dayData?.tasks?.reduce((sum, task) => sum + task.completed_pomodoros, 0) || 0;
  const completedTasks = dayData?.tasks?.filter(task => task.is_completed).length || 0;
  const totalTasks = dayData?.tasks?.length || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="glass rounded-2xl p-8 max-w-2xl w-full relative">
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
                  <div className="w-16 h-16 rounded-full bg-insight-purple/20 flex items-center justify-center">
                    <Moon size={32} className="text-insight-purple" />
                  </div>
                </motion.div>
                <h2 className="text-3xl font-bold mb-2">Day Complete</h2>
                <p className="text-gray-400">
                  Reflect on your progress. Growth happens in reflection.
                </p>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass rounded-xl p-4 text-center"
                >
                  <div className="text-3xl font-bold text-time-red mb-1">
                    {totalPomodoros}
                  </div>
                  <div className="text-xs text-gray-400">Pomodoros</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass rounded-xl p-4 text-center"
                >
                  <div className="text-3xl font-bold text-focus-green mb-1">
                    {completedTasks}/{totalTasks}
                  </div>
                  <div className="text-xs text-gray-400">Tasks Done</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass rounded-xl p-4 text-center"
                >
                  <div className="text-3xl font-bold text-plan-blue mb-1">
                    {Math.round((totalPomodoros * 25) / 60)}h
                  </div>
                  <div className="text-xs text-gray-400">Focus Time</div>
                </motion.div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Satisfaction Rating */}
                <div>
                  <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                    <Star size={16} className="text-insight-purple" />
                    How satisfied are you with today?
                  </label>
                  
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                      <motion.button
                        key={value}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSatisfaction(value)}
                        className={`w-12 h-12 rounded-xl font-bold transition-all ${
                          satisfaction >= value
                            ? value <= 3
                              ? 'bg-time-red text-white'
                              : value <= 7
                              ? 'bg-plan-blue text-white'
                              : 'bg-focus-green text-white'
                            : 'bg-focus-gray text-gray-500 hover:bg-focus-border'
                        }`}
                      >
                        {value}
                      </motion.button>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Not satisfied</span>
                    <span>Very satisfied</span>
                  </div>
                </div>

                {/* Reflection */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp size={16} className="text-focus-green" />
                    What did you learn today?
                  </label>
                  <textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="Wins, challenges, insights for tomorrow..."
                    className="w-full bg-focus-black/50 border border-focus-border rounded-xl px-4 py-3 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-insight-purple"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Capture what matters - this is how you grow
                  </p>
                </div>

                {/* Motivational Quote */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-focus-gray/50 border border-focus-border rounded-xl p-4 text-center italic text-sm text-gray-400"
                >
                  "Progress is not about perfection. It's about showing up."
                  <div className="text-xs mt-1 text-gray-500">— You did that today.</div>
                </motion.div>

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-focus-border hover:bg-white/5 transition-colors"
                  >
                    Skip for now
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 btn-primary py-3"
                  >
                    Save & Rest 🌙
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
