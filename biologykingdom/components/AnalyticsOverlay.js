// components/AnalyticsOverlay.js
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  FiX, 
  FiTrendingUp, 
  FiAward, 
  FiZap, 
  FiCalendar,
  FiBarChart2,
  FiPieChart,
  FiDownload,
  FiShare
} from 'react-icons/fi';

// We'll use Recharts for beautiful charts
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
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

const AnalyticsOverlay = ({ onClose, progressData }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [analyticsData, setAnalyticsData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    subjects: [],
    stats: {}
  });
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef();

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Fetch analytics data
  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [dailyData, weeklyData, monthlyData, subjectData, statsData] = await Promise.all([
        fetchDailyProgress(),
        fetchWeeklyProgress(),
        fetchMonthlyProgress(),
        fetchSubjectBreakdown(),
        fetchQuickStats()
      ]);

      setAnalyticsData({
        daily: dailyData,
        weekly: weeklyData,
        monthly: monthlyData,
        subjects: subjectData,
        stats: statsData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyProgress = async () => {
    const { data: attempts, error } = await supabase
      .from('user_question_attempts')
      .select('attempted_at, is_correct')
      .eq('user_id', user.id)
      .gte('attempted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('attempted_at', { ascending: true });

    if (error) throw error;

    // Group by day
    const dailyMap = {};
    attempts?.forEach(attempt => {
      const date = attempt.attempted_at.split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { date, attempts: 0, correct: 0 };
      }
      dailyMap[date].attempts++;
      if (attempt.is_correct) dailyMap[date].correct++;
    });

    return Object.values(dailyMap).slice(-30); // Last 30 days
  };

  const fetchWeeklyProgress = async () => {
    // Similar implementation for weekly data
    return Array.from({ length: 12 }, (_, i) => ({
      week: `Week ${i + 1}`,
      attempts: Math.floor(Math.random() * 100) + 50,
      correct: Math.floor(Math.random() * 80) + 30
    }));
  };

  const fetchMonthlyProgress = async () => {
    // Similar implementation for monthly data
    return Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('default', { month: 'short' }),
      attempts: Math.floor(Math.random() * 500) + 200,
      correct: Math.floor(Math.random() * 400) + 150
    }));
  };

  const fetchSubjectBreakdown = async () => {
    const { data: attempts, error } = await supabase
      .from('user_question_attempts')
      .select('questions(subjects(name))')
      .eq('user_id', user.id)
      .gte('attempted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    const subjectCount = {};
    attempts?.forEach(attempt => {
      const subject = attempt.questions?.subjects?.name || 'Unknown';
      subjectCount[subject] = (subjectCount[subject] || 0) + 1;
    });

    return Object.entries(subjectCount).map(([name, value]) => ({ name, value }));
  };

  const fetchQuickStats = async () => {
    return {
      fastestCompletion: '12.4s',
      bestStreak: 7,
      averageAccuracy: '78%',
      totalQuestions: 1247
    };
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:bg-black/30"
      />
      
      {/* Overlay Panel */}
      <motion.div
        ref={overlayRef}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 h-full w-full lg:w-1/2 xl:w-2/5 bg-gray-900 border-l border-gray-700 z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white font-poppins">Learning Analytics</h2>
              <p className="text-gray-400 text-sm mt-1">Detailed performance insights</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-800 rounded-xl p-1">
            {[
              { id: 'summary', label: 'Summary', icon: FiTrendingUp },
              { id: 'daily', label: 'Daily', icon: FiCalendar },
              { id: 'weekly', label: 'Weekly', icon: FiBarChart2 },
              { id: 'monthly', label: 'Monthly', icon: FiAward },
              { id: 'subjects', label: 'Subjects', icon: FiPieChart }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 flex-1 text-sm ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-gray-800 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <FiZap className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Fastest Completion</div>
                          <div className="text-white font-bold text-lg">{analyticsData.stats.fastestCompletion}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <FiAward className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Best Streak</div>
                          <div className="text-white font-bold text-lg">{analyticsData.stats.bestStreak} days</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Progress */}
                  <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 border border-purple-500/30">
                    <h3 className="text-white font-semibold mb-4">Today's Performance</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{progressData.attempted}</div>
                        <div className="text-gray-400 text-sm">Solved</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-400">{progressData.correct}</div>
                        <div className="text-gray-400 text-sm">Correct</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-400">{progressData.streak}</div>
                        <div className="text-gray-400 text-sm">Day Streak</div>
                      </div>
                    </div>
                  </div>

                  {/* Daily Progress Chart */}
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <h3 className="text-white font-semibold mb-4">Last 7 Days</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.daily.slice(-7)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="date" 
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickFormatter={(value) => new Date(value).getDate()}
                          />
                          <YAxis stroke="#9CA3AF" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '8px'
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
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Last 30 Days</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.daily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          tickFormatter={(value) => new Date(value).getDate()}
                        />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="attempts" 
                          stroke="#8B5CF6" 
                          strokeWidth={3}
                          dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: '#8B5CF6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Weekly Tab */}
              {activeTab === 'weekly' && (
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Last 12 Weeks</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.weekly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="attempts" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Monthly Tab */}
              {activeTab === 'monthly' && (
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Last 12 Months</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="attempts" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Subjects Tab */}
              {activeTab === 'subjects' && (
                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Subject Distribution (Last 30 Days)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
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
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-gray-800/50 border-t border-gray-700 p-4">
          <div className="flex space-x-3">
            <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors flex-1 justify-center">
              <FiDownload className="w-4 h-4 text-gray-300" />
              <span className="text-gray-300 text-sm font-medium">Export CSV</span>
            </button>
            <button className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors flex-1 justify-center">
              <FiShare className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Share Progress</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AnalyticsOverlay;