import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Task Switch Warning Dialog
 * Shown when user tries to switch tasks mid-pomodoro (after grace period)
 */
export default function TaskSwitchDialog({ isOpen, onClose, onConfirm, currentTask, newTask, timeElapsed }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-2xl p-8 max-w-md w-full relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-time-red/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-time-red" />
            </div>
          </div>

          {/* Header */}
          <h2 className="text-2xl font-bold text-center mb-2">
            Switch Task Mid-Pomodoro?
          </h2>

          {/* Message */}
          <div className="space-y-4 mb-6">
            <p className="text-center text-gray-300">
              You're <span className="font-bold text-time-red">{timeElapsed}</span> into this Pomodoro
            </p>

            <div className="glass rounded-xl p-4 space-y-2">
              <div className="text-sm text-gray-400">Current task:</div>
              <div className="font-medium text-white truncate">{currentTask}</div>
              
              <div className="text-center text-gray-500 my-2">↓</div>
              
              <div className="text-sm text-gray-400">Switching to:</div>
              <div className="font-medium text-focus-blue truncate">{newTask}</div>
            </div>

            <div className="bg-time-red/10 border border-time-red/30 rounded-xl p-4">
              <div className="text-sm font-medium text-time-red mb-2">Switching will:</div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Abort this Pomodoro (won't count toward your goal)</li>
                <li>• Increase your pause count</li>
                <li>• Start fresh on "{newTask}"</li>
              </ul>
            </div>

            <p className="text-xs text-center text-gray-500 italic">
              The Pomodoro Technique works best when you commit to one task.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-focus-border hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-time-red hover:bg-time-red/80 transition-colors font-medium"
            >
              Abort & Switch
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
