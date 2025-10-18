import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Clock, Star, TrendingUp, Filter } from 'lucide-react';
import api from '../api/client';

/**
 * Analytics Dashboard
 * View session history, ratings, and statistics
 */
export default function Analytics({ currentDate }) {
  const [pomodoros, setPomodoros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today'); // 'today' | 'week' | 'month' | 'all'
  const [stats, setStats] = useState({
    total: 0,
    avgFocusScore: 0,
    totalMinutes: 0,
    topReason: '',
  });

  useEffect(() => {
    loadPomodoros();
  }, [currentDate, filter]);

  const loadPomodoros = async () => {
    try {
      setLoading(true);
      let filters = {};

      const today = currentDate || new Date().toISOString().split('T')[0];
      
      if (filter === 'today') {
        filters = { start_date: today, end_date: today };
      } else if (filter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters = { start_date: weekAgo.toISOString().split('T')[0], end_date: today };
      } else if (filter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filters = { start_date: monthAgo.toISOString().split('T')[0], end_date: today };
      }
      // 'all' has no filters

      const data = await api.getPomodoros(filters);
      setPomodoros(data);
      calculateStats(data);
    } catch (error) {
      console.error('Failed to load pomodoros:', error);
      setPomodoros([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({ total: 0, avgFocusScore: 0, totalMinutes: 0, topReason: '', avgPauses: 0 });
      return;
    }

    const total = data.length;
    const totalMinutes = data.reduce((sum, p) => sum + (p.duration_sec / 60), 0);
    const avgFocusScore = data
      .filter(p => p.focus_score)
      .reduce((sum, p) => sum + p.focus_score, 0) / data.filter(p => p.focus_score).length || 0;

    // Calculate average pauses
    const totalPauses = data.reduce((sum, p) => sum + (p.pause_count || 0), 0);
    const avgPauses = (totalPauses / total).toFixed(1);

    // Find most common reason
    const reasons = data.filter(p => p.reason).map(p => p.reason);
    const reasonCounts = reasons.reduce((acc, r) => {
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    setStats({
      total,
      avgFocusScore: avgFocusScore.toFixed(1),
      totalMinutes: Math.round(totalMinutes),
      topReason,
      avgPauses,
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getReasonEmoji = (reason) => {
    const emojiMap = {
      'interruption': '📞',
      'phone': '📱',
      'music helped': '🎵',
      'context switch': '🔄',
      'low energy': '😴',
      'environment': '🌍',
      'deep flow': '🌊',
      'other': '📝',
    };
    return emojiMap[reason] || '📝';
  };

  const renderStars = (score) => {
    if (!score) return <span className="text-gray-500">No rating</span>;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-focus-blue" size={32} />
          <h2 className="text-2xl font-bold">Session Analytics</h2>
          <button
            onClick={loadPomodoros}
            className="text-sm glass px-3 py-1 rounded-lg hover:bg-white/10 transition-all"
            title="Refresh data"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          {['today', 'week', 'month', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition-all ${
                filter === f
                  ? 'bg-focus-blue text-white'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-focus-blue" size={24} />
            <span className="text-gray-400 text-sm">Total Sessions</span>
          </div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Star className="text-yellow-400" size={24} />
            <span className="text-gray-400 text-sm">Avg Focus Score</span>
          </div>
          <div className="text-3xl font-bold">{stats.avgFocusScore}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-green-400" size={24} />
            <span className="text-gray-400 text-sm">Total Minutes</span>
          </div>
          <div className="text-3xl font-bold">{stats.totalMinutes}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">⏸️</span>
            <span className="text-gray-400 text-sm">Avg Pauses</span>
          </div>
          <div className="text-3xl font-bold">{stats.avgPauses}</div>
          <div className="text-xs text-gray-500 mt-1">per session</div>
        </motion.div>
      </div>

      {/* Session History */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Calendar size={24} />
          Session History
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : pomodoros.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No sessions found. Complete a Pomodoro to see it here! 🍅
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {pomodoros.map((pomo, idx) => (
              <motion.div
                key={pomo.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-4 rounded-lg hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-lg">{pomo.task}</span>
                      {pomo.aborted && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          Aborted
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-2 flex items-center gap-3">
                      <span>{formatDate(pomo.start_time)}</span>
                      <span>•</span>
                      <span>{Math.round(pomo.duration_sec / 60)} min</span>
                      {pomo.pause_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-400">⏸️ Paused {pomo.pause_count}x</span>
                        </>
                      )}
                    </div>

                    {pomo.reason && (
                      <div className="text-sm flex items-center gap-2 mb-1">
                        <span>{getReasonEmoji(pomo.reason)}</span>
                        <span className="text-gray-300 capitalize">{pomo.reason}</span>
                      </div>
                    )}

                    {pomo.note && (
                      <div className="text-sm text-gray-400 italic mt-2">
                        "{pomo.note}"
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    {renderStars(pomo.focus_score)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
