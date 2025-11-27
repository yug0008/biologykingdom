// pages/index.js
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ArrowRight, Star, Users, CheckCircle, Quote, Video, BookOpen, Calendar, ShieldQuestion, PenTool, Layout, Target, TrendingUp, Award, Zap, X, BarChart2, PieChart, Download, Share, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { FiBook, FiBarChart2, FiFileText, FiUsers, FiArrowRight } from "react-icons/fi";
// Recharts components for analytics
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Daily Goal Component
const DailyGoalCard = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState({
    attempted: 0,
    target: 140,
    streak: 0,
    percentage: 0,
    correct: 0,
    incorrect: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTargetSettings, setShowTargetSettings] = useState(false);
  const [tempTarget, setTempTarget] = useState(140);

  useEffect(() => {
    if (user) {
      fetchTodayProgress();
      loadUserTarget();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserTarget = () => {
    if (!user) {
      const defaultTarget = localStorage.getItem('default_daily_target');
      if (defaultTarget) {
        setProgress(prev => ({ ...prev, target: parseInt(defaultTarget) }));
      }
      return;
    }
    const savedTarget = localStorage.getItem(`daily_target_${user.id}`);
    if (savedTarget) {
      setProgress(prev => ({ ...prev, target: parseInt(savedTarget) }));
      setTempTarget(parseInt(savedTarget));
    }
  };

  const fetchTodayProgress = async () => {
    if (!user) {
      // For demo purposes, show some random progress
      const demoAttempted = Math.floor(Math.random() * 50) + 20;
      const demoCorrect = Math.floor(demoAttempted * 0.7);
      const demoIncorrect = demoAttempted - demoCorrect;
      const target = localStorage.getItem('default_daily_target') || 140;
      const percentage = Math.min((demoAttempted / target) * 100, 100);
      
      setProgress({
        attempted: demoAttempted,
        target: parseInt(target),
        streak: Math.floor(Math.random() * 7) + 1,
        percentage,
        correct: demoCorrect,
        incorrect: demoIncorrect
      });
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's attempts
      const { data: todayAttempts, error } = await supabase
        .from('user_question_attempts')
        .select('is_correct')
        .eq('user_id', user.id)
        .gte('attempted_at', `${today}T00:00:00`)
        .lt('attempted_at', `${today}T23:59:59`);

      if (error) throw error;

      const attempted = todayAttempts?.length || 0;
      const correct = todayAttempts?.filter(attempt => attempt.is_correct === true).length || 0;
      const incorrect = todayAttempts?.filter(attempt => attempt.is_correct === false).length || 0;
      
      // Get user's daily target
      const savedTarget = localStorage.getItem(`daily_target_${user.id}`);
      const target = savedTarget ? parseInt(savedTarget) : 140;
      const percentage = Math.min((attempted / target) * 100, 100);
      
      // Calculate current streak
      const streak = await calculateCurrentStreak();

      setProgress({
        attempted,
        target,
        streak,
        percentage,
        correct,
        incorrect
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Fallback to demo data
      const demoAttempted = Math.floor(Math.random() * 50) + 20;
      const demoCorrect = Math.floor(demoAttempted * 0.7);
      const demoIncorrect = demoAttempted - demoCorrect;
      const target = localStorage.getItem(`daily_target_${user.id}`) || 140;
      const percentage = Math.min((demoAttempted / target) * 100, 100);
      
      setProgress({
        attempted: demoAttempted,
        target: parseInt(target),
        streak: Math.floor(Math.random() * 7) + 1,
        percentage,
        correct: demoCorrect,
        incorrect: demoIncorrect
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentStreak = async () => {
    if (!user) return Math.floor(Math.random() * 7) + 1;

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
      return Math.floor(Math.random() * 7) + 1;
    }
  };

  const saveTarget = () => {
    if (user) {
      localStorage.setItem(`daily_target_${user.id}`, tempTarget.toString());
    } else {
      localStorage.setItem('default_daily_target', tempTarget.toString());
    }
    setProgress(prev => ({ 
      ...prev, 
      target: tempTarget,
      percentage: Math.min((prev.attempted / tempTarget) * 100, 100)
    }));
    setShowTargetSettings(false);
  };

  const getStepperIcons = () => {
    const steps = Math.min(Math.ceil(progress.attempted / (progress.target / 7)), 7);
    return Array.from({ length: 7 }, (_, i) => i < steps);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-b from-slate-900 to-slate-900 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 animate-pulse w-full max-w-4xl mx-auto">
        <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-700 rounded w-1/2 mb-3"></div>
        <div className="flex space-x-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-slate-700 rounded"></div>
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
        className="bg-gradient-to-b from-slate-900 to-slate-900 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 cursor-pointer hover:border-blue-500/50 transition-all duration-300 group relative overflow-hidden w-full max-w-4xl mx-auto"
        onClick={() => setShowAnalytics(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Target className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white text-sm font-semibold">
              Daily Goal
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {progress.streak > 0 && (
              <div className="flex items-center space-x-1 bg-orange-500/20 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 text-orange-400" />
                <span className="text-orange-400 text-xs font-bold">{progress.streak}d</span>
              </div>
            )}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setTempTarget(progress.target);
                setShowTargetSettings(true);
              }}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Progress Text */}
        <div className="mb-3">
          <div className="text-2xl font-bold text-white mb-1">
            {progress.attempted}<span className="text-gray-400 text-lg">/{progress.target}</span>
          </div>
          <div className="text-gray-400 text-xs">
            {progress.correct} correct • {progress.incorrect} incorrect • {Math.round(progress.percentage)}% completed
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
                  : 'bg-slate-700'
              } ${filled && index === getStepperIcons().length - 1 ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-1.5 rounded-full ${
              progress.percentage >= 100 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
          />
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>

      {/* Target Settings Modal */}
      <AnimatePresence>
        {showTargetSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTargetSettings(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 rounded-2xl p-6 z-50 w-11/12 max-w-md"
            >
              <h3 className="text-white text-lg font-bold mb-4">Set Daily Target</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Questions per day
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(parseInt(e.target.value) || 140)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-slate-400 text-xs mt-2">
                    Recommended: 140 questions for optimal learning
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowTargetSettings(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTarget}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg transition-all duration-300"
                  >
                    Save Target
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Analytics Overlay */}
      <AnimatePresence>
        {showAnalytics && (
          <AnalyticsOverlay 
            onClose={() => setShowAnalytics(false)}
            progressData={progress}
            onTargetChange={() => {
              loadUserTarget();
              fetchTodayProgress();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Analytics Overlay Component
const AnalyticsOverlay = ({ onClose, progressData, onTargetChange }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [analyticsData, setAnalyticsData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    subjects: [],
    stats: {},
    streakData: {
      currentStreak: 0,
      longestStreak: 0,
      weekly: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [showTargetSettings, setShowTargetSettings] = useState(false);
  const [tempTarget, setTempTarget] = useState(progressData.target);
  const overlayRef = useRef();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [dailyData, weeklyData, monthlyData, subjectData, statsData, streakData] = await Promise.all([
        fetchDailyProgress(),
        fetchWeeklyProgress(),
        fetchMonthlyProgress(),
        fetchSubjectBreakdown(),
        fetchQuickStats(),
        fetchStreakData()
      ]);

      setAnalyticsData({
        daily: dailyData,
        weekly: weeklyData,
        monthly: monthlyData,
        subjects: subjectData,
        stats: statsData,
        streakData: streakData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set demo data
      setAnalyticsData(getDemoAnalyticsData());
    } finally {
      setLoading(false);
    }
  };

  const getDemoAnalyticsData = () => {
    // Generate demo data for non-authenticated users
    const daily = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        attempts: Math.floor(Math.random() * 50) + 20,
        correct: Math.floor(Math.random() * 35) + 15
      };
    });

    const weekly = Array.from({ length: 12 }, (_, i) => ({
      week: `Week ${i + 1}`,
      attempts: Math.floor(Math.random() * 200) + 100,
      correct: Math.floor(Math.random() * 150) + 80
    }));

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2024, i, 1).toLocaleString('default', { month: 'short' });
      return {
        month,
        attempts: Math.floor(Math.random() * 800) + 400,
        correct: Math.floor(Math.random() * 600) + 300
      };
    });

    const subjects = [
      { name: 'Biology', value: 35 },
      { name: 'Chemistry', value: 28 },
      { name: 'Physics', value: 22 },
      { name: 'Mathematics', value: 15 }
    ];

    return {
      daily,
      weekly,
      monthly,
      subjects,
      stats: {
        fastestCompletion: '45s',
        averageAccuracy: '72%',
        totalQuestions: 2450,
        bestStreak: 14
      },
      streakData: {
        currentStreak: progressData.streak,
        longestStreak: 14,
        weekly: Array.from({ length: 7 }, (_, i) => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return {
            day: days[i],
            attempted: Math.floor(Math.random() * 40) + 10,
            correct: Math.floor(Math.random() * 30) + 5,
            incorrect: Math.floor(Math.random() * 10) + 1,
          };
        })
      }
    };
  };

  
  const fetchDailyProgress = async () => {
    if (!user) return getDemoAnalyticsData().daily;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: attempts, error } = await supabase
      .from('user_question_attempts')
      .select('attempted_at, is_correct')
      .eq('user_id', user.id)
      .gte('attempted_at', thirtyDaysAgo.toISOString())
      .order('attempted_at', { ascending: true });

    if (error) throw error;

    const dailyMap = {};
    const currentDate = new Date();
    
    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap[dateStr] = { date: dateStr, attempts: 0, correct: 0 };
    }

    // Fill with actual data
    attempts?.forEach(attempt => {
      const date = attempt.attempted_at.split('T')[0];
      if (dailyMap[date]) {
        dailyMap[date].attempts++;
        if (attempt.is_correct) dailyMap[date].correct++;
      }
    });

    return Object.values(dailyMap);
  };

  const fetchWeeklyProgress = async () => {
    if (!user) return getDemoAnalyticsData().weekly;

    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 weeks

    const { data: attempts, error } = await supabase
      .from('user_question_attempts')
      .select('attempted_at, is_correct')
      .eq('user_id', user.id)
      .gte('attempted_at', twelveWeeksAgo.toISOString());

    if (error) throw error;

    const weeklyData = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(currentDate);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekAttempts = attempts?.filter(attempt => {
        const attemptDate = new Date(attempt.attempted_at);
        return attemptDate >= weekStart && attemptDate <= weekEnd;
      }) || [];

      weeklyData.push({
        week: `Week ${12 - i}`,
        attempts: weekAttempts.length,
        correct: weekAttempts.filter(a => a.is_correct).length
      });
    }

    return weeklyData;
  };

  const fetchMonthlyProgress = async () => {
    if (!user) return getDemoAnalyticsData().monthly;

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const { data: attempts, error } = await supabase
      .from('user_question_attempts')
      .select('attempted_at, is_correct')
      .eq('user_id', user.id)
      .gte('attempted_at', twelveMonthsAgo.toISOString());

    if (error) throw error;

    const monthlyData = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(currentDate);
      month.setMonth(month.getMonth() - i);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthAttempts = attempts?.filter(attempt => {
        const attemptDate = new Date(attempt.attempted_at);
        return attemptDate >= monthStart && attemptDate <= monthEnd;
      }) || [];

      monthlyData.push({
        month: month.toLocaleString('default', { month: 'short' }),
        attempts: monthAttempts.length,
        correct: monthAttempts.filter(a => a.is_correct).length
      });
    }

    return monthlyData;
  };

  const fetchSubjectBreakdown = async () => {
    if (!user) return getDemoAnalyticsData().subjects;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: attempts, error } = await supabase
      .from('user_question_attempts')
      .select(`
        questions (
          chapters (
            subjects (name)
          )
        )
      `)
      .eq('user_id', user.id)
      .gte('attempted_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    const subjectCount = {};
    attempts?.forEach(attempt => {
      const subject = attempt.questions?.chapters?.subjects?.name || 'Unknown';
      subjectCount[subject] = (subjectCount[subject] || 0) + 1;
    });

    return Object.entries(subjectCount).map(([name, value]) => ({ name, value }));
  };

  const fetchQuickStats = async () => {
    if (!user) return getDemoAnalyticsData().stats;

    // Calculate fastest completion (average time per question)
    const { data: recentAttempts } = await supabase
      .from('user_question_attempts')
      .select('time_taken, is_correct')
      .eq('user_id', user.id)
      .not('time_taken', 'is', null)
      .limit(100);

    const avgTime = recentAttempts?.length 
      ? (recentAttempts.reduce((sum, attempt) => sum + (attempt.time_taken || 0), 0) / recentAttempts.length).toFixed(1)
      : '0.0';

    // Calculate accuracy
    const { data: allAttempts } = await supabase
      .from('user_question_attempts')
      .select('is_correct')
      .eq('user_id', user.id);

    const total = allAttempts?.length || 0;
    const correct = allAttempts?.filter(a => a.is_correct).length || 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      fastestCompletion: `${avgTime}s`,
      averageAccuracy: `${accuracy}%`,
      totalQuestions: total,
      bestStreak: await calculateLongestStreak()
    };
  };

  const calculateLongestStreak = async () => {
    if (!user) return 14;

    const { data: attempts } = await supabase
      .from('user_question_attempts')
      .select('attempted_at')
      .eq('user_id', user.id)
      .order('attempted_at', { ascending: true });

    if (!attempts?.length) return 0;

    let longestStreak = 0;
    let currentStreak = 1;
    let lastDate = new Date(attempts[0].attempted_at);

    for (let i = 1; i < attempts.length; i++) {
      const currentDate = new Date(attempts[i].attempted_at);
      const diffTime = currentDate - lastDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
      lastDate = currentDate;
    }

    return Math.max(longestStreak, currentStreak);
  };

  const fetchStreakData = async () => {
    if (!user) return getDemoAnalyticsData().streakData;

    // Get weekly data for streak calendar
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const { data: weeklyAttempts } = await supabase
      .from('user_question_attempts')
      .select('attempted_at, is_correct')
      .eq('user_id', user.id)
      .gte('attempted_at', weekStart.toISOString())
      .order('attempted_at', { ascending: true });

    // Calculate current streak
    const { data: allAttempts } = await supabase
      .from('user_question_attempts')
      .select('attempted_at')
      .eq('user_id', user.id)
      .order('attempted_at', { ascending: false });

    let currentStreak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const hasAttempt = allAttempts?.some(attempt => 
        attempt.attempted_at.startsWith(dateStr)
      );

      if (hasAttempt) {
        currentStreak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Format weekly data
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = daysOfWeek.map(day => {
      const dayIndex = daysOfWeek.indexOf(day);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (6 - dayIndex));
      targetDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayAttempts = weeklyAttempts?.filter(attempt => {
        const attemptDate = new Date(attempt.attempted_at);
        return attemptDate >= targetDate && attemptDate < nextDay;
      }) || [];

      return {
        day,
        attempted: dayAttempts.length,
        correct: dayAttempts.filter(attempt => attempt.is_correct === true).length,
        incorrect: dayAttempts.filter(attempt => attempt.is_correct === false).length,
      };
    });

    return {
      currentStreak,
      longestStreak: await calculateLongestStreak(),
      weekly: weeklyData
    };
  };

  const saveTarget = () => {
    if (user) {
      localStorage.setItem(`daily_target_${user.id}`, tempTarget.toString());
    } else {
      localStorage.setItem('default_daily_target', tempTarget.toString());
    }
    setShowTargetSettings(false);
    onTargetChange();
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />
      
      {/* Overlay Panel - RESPONSIVE FOR MOBILE */}
      <motion.div
        ref={overlayRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 h-full w-full sm:w-1/2 lg:w-2/5 xl:w-1/3 min-w-[320px] max-w-2xl bg-slate-900 border-l border-slate-700 z-50 flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Inter']">Learning Analytics</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Detailed performance insights</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setTempTarget(progressData.target);
                  setShowTargetSettings(true);
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 hover:text-white" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tabs - SCROLLABLE FOR MOBILE */}
          <div className="flex space-x-1 mt-4 sm:mt-6 bg-slate-800 rounded-xl p-1 overflow-x-auto">
            {[
              { id: 'summary', label: 'Summary', icon: TrendingUp },
              { id: 'daily', label: 'Daily', icon: Calendar },
              { id: 'weekly', label: 'Weekly', icon: BarChart2 },
              { id: 'monthly', label: 'Monthly', icon: Award },
              { id: 'subjects', label: 'Subjects', icon: PieChart }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 flex-shrink-0 text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
                  <div className="h-48 sm:h-64 bg-slate-800 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 bg-green-500/20 rounded-lg">
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs sm:text-sm">Fastest Completion</div>
                          <div className="text-white font-bold text-base sm:text-lg">{analyticsData.stats.fastestCompletion}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-slate-400 text-xs sm:text-sm">Best Streak</div>
                          <div className="text-white font-bold text-base sm:text-lg">{analyticsData.stats.bestStreak} days</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Progress */}
                  <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-4 sm:p-6 border border-blue-500/30">
                    <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Today's Performance</h3>
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-white">{progressData.attempted}</div>
                        <div className="text-slate-400 text-xs sm:text-sm">Solved</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-green-400">{progressData.correct}</div>
                        <div className="text-slate-400 text-xs sm:text-sm">Correct</div>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-orange-400">{analyticsData.streakData.currentStreak}</div>
                        <div className="text-slate-400 text-xs sm:text-sm">Day Streak</div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Progress Chart */}
                  <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700">
                    <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Last 7 Days</h3>
                    <div className="h-40 sm:h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.daily.slice(-7)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            fontSize={10}
                            tickFormatter={(value) => new Date(value).getDate()}
                          />
                          <YAxis stroke="#9CA3AF" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="attempts" 
                            stroke="#8B5CF6" 
                            fill="url(#colorUv)" 
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Tab */}
              {activeTab === 'daily' && (
                <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Last 30 Days</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          fontSize={10}
                          tickFormatter={(value) => new Date(value).getDate()}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="attempts" 
                          stroke="#8B5CF6" 
                          strokeWidth={2}
                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5, fill: '#8B5CF6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Weekly Tab */}
              {activeTab === 'weekly' && (
                <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Last 12 Weeks</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.weekly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="week" stroke="#9CA3AF" fontSize={10} />
                        <YAxis stroke="#9CA3AF" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="attempts" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Monthly Tab */}
              {activeTab === 'monthly' && (
                <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Last 12 Months</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} />
                        <YAxis stroke="#9CA3AF" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="attempts" fill="#10B981" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Subjects Tab */}
              {activeTab === 'subjects' && (
                <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700">
                  <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Subject Distribution (Last 30 Days)</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={analyticsData.subjects}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analyticsData.subjects.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-slate-800/50 border-t border-slate-700 p-3 sm:p-4">
          <div className="flex space-x-2 sm:space-x-3">
            <button className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-3 sm:px-4 py-2 rounded-lg transition-colors flex-1 justify-center text-xs sm:text-sm">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 text-slate-300" />
              <span className="text-slate-300 font-medium">Export CSV</span>
            </button>
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 sm:px-4 py-2 rounded-lg transition-colors flex-1 justify-center text-xs sm:text-sm">
              <Share className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              <span className="text-white font-medium">Share Progress</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Target Settings Modal */}
      <AnimatePresence>
        {showTargetSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTargetSettings(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 rounded-2xl p-4 sm:p-6 z-[60] w-11/12 max-w-md"
            >
              <h3 className="text-white text-lg font-bold mb-4">Set Daily Target</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 text-sm mb-2 block">
                    Questions per day
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(parseInt(e.target.value) || 140)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm sm:text-base"
                  />
                  <p className="text-slate-400 text-xs mt-2">
                    Recommended: 140 questions for optimal learning
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowTargetSettings(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTarget}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg transition-all duration-300 text-sm sm:text-base"
                  >
                    Save Target
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Button Component
const Button = ({ children, variant = 'primary', className = '', icon, onClick, href }) => {
  const baseStyle = "px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 relative overflow-hidden group text-sm sm:text-base";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 border border-transparent",
    secondary: "bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-100 hover:border-blue-200",
    outline: "bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500/5",
    glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
    dark: "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 shadow-lg",
  };

  const buttonContent = (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon}
      </span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </motion.span>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {buttonContent}
      </a>
    );
  }

  return (
    <button onClick={onClick} className="inline-block">
      {buttonContent}
    </button>
  );
};
// Subheader Component (Improved Mobile UI)
const Subheader = () => {
  return (
    <section className="bg-slate-900 border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3">

          {/* LEFT SECTION */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src="https://pbs.twimg.com/profile_images/1689922352421998592/da1QWRF1_400x400.jpg"
                alt="NEET Logo"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title — visible on both mobile + desktop */}
            <div>
              <h1 className="font-bold text-white text-base sm:text-lg">
                NEET UG PYQ
              </h1>
              <p className="text-xs text-gray-300">Previous Year Questions</p>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">

            {/* Total Questions — mobile smaller */}
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-bold text-blue-400">
                24,874
              </div>
              <div className="text-xs text-gray-400">Total Questions</div>
            </div>

            {/* Start Practicing Button — mobile smaller + full width */}
            <Button
              variant="primary"
              icon={<ArrowRight size={14} />}
              href="/pyq/exams/neet"
              className="text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-3"
            >
              Start
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
const features = [
  {
    icon: FiBook,
    title: 'Practice PYQs',
    description: 'Access previous year questions from NEET, AIIMS, JIPMER and more',
    color: 'from-purple-500 to-pink-500',
    path: '/pyq'
  },
  {
    icon: FiBarChart2,
    title: 'Smart Tests',
    description: 'AI-powered tests that adapt to your learning level',
    color: 'from-blue-500 to-cyan-500',
    path: '/tests'
  },
  {
    icon: FiFileText,
    title: 'Daily Practice',
    description: 'Curated DPPs for consistent practice and improvement',
    color: 'from-green-500 to-emerald-500',
    path: '/dpp'
  },
  {
    icon: FiUsers,
    title: 'Mentorship',
    description: 'Get guidance from top performers and subject experts',
    color: 'from-orange-500 to-red-500',
    path: '/mentorship'
  }
];
// Daily Goal Section Component
const DailyGoalSection = () => {
  return (
    <section className="py-2 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <DailyGoalCard />
      </div>
    </section>
  );
};

// Features Section with Dark Background
const Features = () => {
  const features = [
    { title: 'Live Classes', description: 'Real-time interactive learning with top educators.', icon: Video, color: 'text-red-400' },
    { title: 'Recorded Lessons', description: 'Access unlimited library of high-quality recordings.', icon: BookOpen, color: 'text-blue-400' },
    { title: 'Smart Planner', description: 'AI-driven study scheduler to keep you on track.', icon: Calendar, color: 'text-green-400' },
    { title: 'Instant Doubts', description: 'Get your questions answered instantly by experts.', icon: ShieldQuestion, color: 'text-purple-400' },
    { title: 'Mock Tests', description: 'Practice to perfection with detailed analysis.', icon: PenTool, color: 'text-orange-400' },
    { title: 'Revision Notes', description: 'Concise, high-impact notes for quick revision.', icon: Layout, color: 'text-teal-400' },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-900 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-800 to-transparent z-10" />
      
      {/* Stars Background */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-['Inter']">
            Why Choose <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">BiologyKingdom</span>?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-['Inter']">
            We provide a comprehensive ecosystem designed to maximize your learning potential 
            through cutting-edge technology and expert guidance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2 } 
              }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 border border-slate-700/50 group relative overflow-hidden"
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg ${feature.color} bg-opacity-50 group-hover:bg-opacity-70`}>
                  <feature.icon size={24} className={feature.color} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-['Inter'] group-hover:text-gray-100 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed font-['Inter'] group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Banner Section
const Banner = () => {
  return (
    <section className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
  <div className="relative w-full min-h-[260px] sm:min-h-[380px] md:min-h-[480px] lg:min-h-[550px]">

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#ffffff_1px,_transparent_0)] bg-[length:40px_40px]" />
        </div>
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6"
            >
              Master <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">NEET UG</span> Preparation
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-sm sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Access 24,874+ previous year questions, detailed solutions, and AI-powered analytics to boost your NEET score.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              <Button variant="primary" icon={<Play size={18} />} className="text-sm sm:text-base">
                Watch Demo
              </Button>
              <Button variant="glass" icon={<ArrowRight size={18} />} className="text-sm sm:text-base">
                Explore Features
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Floating Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
          className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-400 rounded-full opacity-60"
        />
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 5, delay: 1 }}
          className="absolute top-3/4 right-1/3 w-3 h-3 bg-purple-400 rounded-full opacity-60"
        />
        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 7, delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-blue-300 rounded-full opacity-40"
        />
      </div>
    </section>
  );
};

// Educators Section with Dark Background
const Educators = () => {
  const educators = [
  { 
    id: '1', 
    name: 'Dr. Yogesh Jindal', 
    subject: 'Biology', 
    students: '50k+', 
    courses: 12, 
    image: 'https://picsum.photos/seed/eleanor/200/200' 
  },
  { 
    id: '2', 
    name: 'Prof. Radhika Sharma', 
    subject: 'Physics', 
    students: '42k+', 
    courses: 8, 
    image: 'https://picsum.photos/seed/jamesk/200/200' 
  },
  { 
    id: '3', 
    name: 'Dr. Anil Verma', 
    subject: 'Mathematics', 
    students: '35k+', 
    courses: 15, 
    image: 'https://picsum.photos/seed/maria/200/200' 
  },
  { 
    id: '4', 
    name: 'Prof. Meera Nair', 
    subject: 'Chemistry', 
    students: '60k+', 
    courses: 20, 
    image: 'https://picsum.photos/seed/kenji/200/200' 
  },
];


  return (
    <section className="py-20 bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#ffffff_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4"
        >
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-['Inter']">
              World-Class <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Educators</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-xl font-['Inter']">
              Learn from industry experts and experienced educators who are passionate about your success.
            </p>
          </div>
          <Button variant="outline" className="whitespace-nowrap text-sm border-white text-white hover:bg-white/10">
            View All Mentors
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {educators.map((edu, index) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group text-center relative"
            >
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4">
                {/* Gradient Background */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg scale-110" />
                
                {/* Image Container */}
                <div className="relative w-full h-full rounded-full p-1.5 bg-slate-700 border-2 border-slate-600 group-hover:border-transparent transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/25">
                  <img 
                    src={edu.image} 
                    alt={edu.name} 
                    className="w-full h-full rounded-full object-cover shadow-inner" 
                  />
                </div>
                
                {/* Course Badge */}
                <div className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full px-2 py-1 shadow-lg border border-slate-600">
                  <span className="text-xs font-bold text-white">{edu.courses} courses</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors font-['Inter']">
                {edu.name}
              </h3>
              <p className="text-gray-400 mb-3 text-sm font-['Inter']">{edu.subject}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 rounded-full text-xs font-semibold shadow-md border border-slate-600 group-hover:shadow-lg group-hover:border-blue-500/50 transition-all">
                <Users size={14} className="text-blue-400" />
                <span className="text-gray-300">{edu.students}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section with Dark Background
const Testimonials = () => {
  const testimonials = [
  {
    name: "Arjun Mehta",
    role: "JEE Aspirant",
    text: "BiologyKingdom ke lectures aur practice system ne meri preparation ka level hi change kar diya. 3D explanations ne Physics ko itna easy bana diya jitna kabhi socha nahi tha.",
    img: "https://picsum.photos/seed/alex/150/150"
  },
  {
    name: "Saniya Khan",
    role: "NEET Aspirant",
    text: "AI planner ne mujhe daily routine manage karne me bahut help ki. Pehle confusion hoti thi, ab har subject time pe complete hota hai. Biology diagrams yahan next-level hain!",
    img: "https://picsum.photos/seed/sarahlee/150/150"
  },
  {
    name: "Rohit Singh",
    role: "Railway Aspirant",
    text: "BiologyKingdom sirf padhai nahi, ek proper guidance system deta hai. Clean UI, smart tests, aur detailed analysis ne meri speed & accuracy dono improve ki.",
    img: "https://picsum.photos/seed/david/150/150"
  }
];




  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#ffffff_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-['Inter']">
            Loved by <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Learners</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-xl mx-auto font-['Inter']">
            Join thousands of successful students who transformed their learning journey with BiologyKingdom
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -6 }}
              className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg shadow-slate-900/40 border border-slate-700/50 flex flex-col relative group hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 text-blue-400 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={48} />
              </div>
              
              <div className="mb-4 text-blue-400 opacity-80">
                <Quote size={24} />
              </div>
              
              <p className="text-gray-300 mb-6 flex-1 leading-relaxed font-['Inter'] group-hover:text-gray-200 transition-colors">
                "{t.text}"
              </p>
              
              <div className="flex items-center gap-3">
                <img 
                  src={t.img} 
                  alt={t.name} 
                  className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-slate-600 group-hover:border-blue-500/50 transition-colors" 
                />
                <div>
                  <h4 className="font-bold text-white font-['Inter']">{t.name}</h4>
                  <p className="text-gray-400 text-sm font-['Inter']">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main Home Component
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Subheader />
      <DailyGoalSection />
<section className="w-full  bg-gradient-to-b from-slate-900 to-slate-800 relative text-gray-200 py-10 px-4 sm:px-8">
  


  {/* FEATURES SECTION - SAME SECTION */}
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
    {features.map((item, index) => (
      <div
        key={index}
        className=" bg-gradient-to-b from-slate-900 to-slate-800 relative border border-gray-800 p-4 rounded-xl shadow hover:scale-105 transition cursor-pointer"
      >
        {/* Icon Box */}
        <div className={`p-3 bg-gradient-to-br ${item.color} rounded-lg w-fit mb-3`}>
          <item.icon className="text-white text-2xl" />
        </div>

        {/* Title */}
        <h2 className="text-white font-semibold text-sm sm:text-base">
          {item.title}
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-xs mt-1 leading-tight">
          {item.description}
        </p>
      </div>
    ))}
  </div>
</section>

      <Features />
      <Banner />
      
      <Educators />
      <Testimonials />
     

    </div>
  );
}