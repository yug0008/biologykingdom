// components/DailyGoalCard.js
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { FiTarget, FiTrendingUp, FiAward, FiZap, FiCalendar } from 'react-icons/fi';

const DailyGoalCard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState({
    attempted: 0,
    target: 140,
    streak: 0,
    percentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTodayProgress();
    }
  }, [user]);

  const fetchTodayProgress = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's attempts
      const { data: todayAttempts, error } = await supabase
        .from('user_question_attempts')
        .select('id, is_correct')
        .eq('user_id', user.id)
        .gte('attempted_at', `${today}T00:00:00`)
        .lt('attempted_at', `${today}T23:59:59`);

      if (error) throw error;

      const attempted = todayAttempts?.length || 0;
      const correct = todayAttempts?.filter(attempt => attempt.is_correct === true).length || 0;
      const percentage = Math.min((attempted / progress.target) * 100, 100);

      // Calculate current streak
      const streak = await calculateCurrentStreak();

      setProgress({
        attempted,
        target: progress.target,
        streak,
        percentage,
        correct
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentStreak = async () => {
    if (!user) return 0;

    try {
      const { data: attempts, error } = await supabase
        .from('user_question_attempts')
        .select('attempted_at')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: false });

      if (error) throw error;

      let streak = 0;
      let currentDate = new Date();
      
      // Check consecutive days with attempts
      for (let i = 0; i < 365; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasAttempt = attempts?.some(attempt => 
          attempt.attempted_at.startsWith(dateStr)
        );

        if (hasAttempt) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }

      return streak;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  };

  const getStepperIcons = () => {
    const steps = Math.min(Math.ceil(progress.attempted / 20), 7);
    return Array.from({ length: 7 }, (_, i) => i < steps);
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2 mb-3"></div>
        <div className="flex space-x-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 cursor-pointer hover:border-purple-500/50 transition-all duration-300 group"
        onClick={() => setShowAnalytics(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <FiTarget className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white text-sm font-semibold">
              Daily Goal
            </span>
          </div>
          {progress.streak > 0 && (
            <div className="flex items-center space-x-1 bg-orange-500/20 px-2 py-1 rounded-full">
              <FiTrendingUp className="w-3 h-3 text-orange-400" />
              <span className="text-orange-400 text-xs font-bold">{progress.streak}d</span>
            </div>
          )}
        </div>

        {/* Progress Text */}
        <div className="mb-3">
          <div className="text-2xl font-bold text-white mb-1">
            {progress.attempted}<span className="text-gray-400 text-lg">/{progress.target}</span>
          </div>
          <div className="text-gray-400 text-xs">
            Questions solved today • {progress.correct} correct
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="flex space-x-1 mb-2">
          {getStepperIcons().map((filled, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                filled 
                  ? 'bg-gradient-to-r from-green-400 to-teal-400' 
                  : 'bg-gray-700'
              } ${filled && index === getStepperIcons().length - 1 ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-1.5 rounded-full ${
              progress.percentage >= 100 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}
          />
        </div>

        {/* Hover Indicator */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>

      {/* Analytics Overlay */}
      <AnimatePresence>
        {showAnalytics && (
          <AnalyticsOverlay 
            onClose={() => setShowAnalytics(false)}
            progressData={progress}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DailyGoalCard;