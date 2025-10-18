import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';

/**
 * Pomodoro Session Review Dialog
 * Collect feedback after each focus session:
 * - Focus rating (1-5 stars)
 * - Reason (optional dropdown)
 * - Additional notes (optional)
 */
export default function PomodoroReview({ isOpen, onClose, onSave, taskName }) {
  const [focusScore, setFocusScore] = useState(3);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const reasons = [
    { value: '', label: '-- Select reason (optional) --' },
    { value: 'interruption', label: '📞 Interruption' },
    { value: 'phone', label: '📱 Phone distraction' },
    { value: 'music helped', label: '🎵 Music helped' },
    { value: 'context switch', label: '🔄 Context switching' },
    { value: 'low energy', label: '😴 Low energy' },
    { value: 'environment', label: '🌍 Environment issues' },
    { value: 'deep flow', label: '🌊 Deep flow state' },
    { value: 'other', label: '📝 Other' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      focus_score: focusScore,
      reason: reason || null,
      note: note.trim() || null,
    });
    handleClose();
  };

  const handleSkip = () => {
    // Save with just the focus score (default 3)
    onSave({
      focus_score: focusScore,
      reason: null,
      note: null,
    });
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setFocusScore(3);
    setReason('');
    setNote('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="glass rounded-2xl p-8 max-w-md w-full relative">
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </motion.button>

              {/* Header */}
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="text-5xl mb-3"
                >
                  🍅
                </motion.div>
                <h2 className="text-2xl font-bold mb-1">Pomodoro Complete!</h2>
                {taskName && (
                  <p className="text-gray-400 text-sm">on: {taskName}</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Focus Rating */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-center">
                    How was your focus? (1-5)
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFocusScore(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        className="focus:outline-none"
                      >
                        <Star
                          size={40}
                          className={`transition-colors ${
                            star <= (hoveredStar || focusScore)
                              ? 'fill-time-red text-time-red'
                              : 'text-gray-600'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-2">
                    {focusScore === 1 && 'Very distracted'}
                    {focusScore === 2 && 'Somewhat distracted'}
                    {focusScore === 3 && 'Okay focus'}
                    {focusScore === 4 && 'Good focus'}
                    {focusScore === 5 && 'Deep flow! 🔥'}
                  </div>
                </div>

                {/* Reason Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Any specific reason? (optional)
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-focus-black/50 border border-focus-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-time-red"
                  >
                    {reasons.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Note Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Additional notes (optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any thoughts or reflections..."
                    className="w-full bg-focus-black/50 border border-focus-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-time-red"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex-1 btn-secondary py-3"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary py-3"
                  >
                    Save Review
                  </button>
                </div>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                💡 Reviewing your sessions helps you understand your productivity patterns
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
