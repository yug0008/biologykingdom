// pages/pyq/exams/[exam]/analysis.js
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { queryClient } from '../../../../lib/react-query'
import { useExamData, useSubjects, useChaptersWithStats } from '../../../../hooks/useExamData'
import { useAuth } from '../../../../hooks/useAuth'
import { useUserQuestionAttempts } from '../../../../hooks/useUserQuestionAttempts'
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
  Area,
  Legend
} from 'recharts'
import { 
  FiFilter, FiX, FiChevronRight, FiBook, FiBarChart2, FiClock, 
  FiLoader, FiCircle, FiMenu, FiTrendingUp, FiAward, FiTarget,
  FiCheckCircle, FiXCircle, FiBookOpen, FiPieChart, FiCalendar,
  FiStar, FiFlag, FiClock as FiClockIcon, FiPlay, FiArrowRight
} from 'react-icons/fi'

// Custom hooks for analytics
const useExamAnalytics = (userId, examId) => {
  const { data: attempts = [], isLoading } = useUserQuestionAttempts(userId, null)
  const { data: subjects = [] } = useSubjects(examId, !!examId)
  const { data: examData } = useExamData(examId, !!examId)

  const analytics = useMemo(() => {
    if (!attempts.length) return null

    // Overall stats
    const totalAttempts = attempts.length
    const correctAttempts = attempts.filter(a => a.is_correct).length
    const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0
    const totalTimeTaken = attempts.reduce((sum, a) => sum + (a.time_taken || 0), 0)
    const avgTimePerQuestion = totalAttempts > 0 ? totalTimeTaken / totalAttempts : 0

    // Subject-wise analysis
    const subjectStats = subjects.map(subject => {
      const subjectAttempts = attempts.filter(a => a.subject_id === subject.id)
      const subjectCorrect = subjectAttempts.filter(a => a.is_correct).length
      const subjectAccuracy = subjectAttempts.length > 0 ? (subjectCorrect / subjectAttempts.length) * 100 : 0
      
      return {
        ...subject,
        totalAttempts: subjectAttempts.length,
        correctAttempts: subjectCorrect,
        accuracy: subjectAccuracy,
        timeSpent: subjectAttempts.reduce((sum, a) => sum + (a.time_taken || 0), 0),
        avgTime: subjectAttempts.length > 0 ? subjectAttempts.reduce((sum, a) => sum + (a.time_taken || 0), 0) / subjectAttempts.length : 0
      }
    })

    // Chapter-wise analysis
    const chapterStats = attempts.reduce((acc, attempt) => {
      if (!acc[attempt.chapter_id]) {
        acc[attempt.chapter_id] = {
          chapter_id: attempt.chapter_id,
          totalAttempts: 0,
          correctAttempts: 0,
          timeSpent: 0,
          questions: new Set()
        }
      }
      acc[attempt.chapter_id].totalAttempts++
      acc[attempt.chapter_id].questions.add(attempt.question_id)
      if (attempt.is_correct) acc[attempt.chapter_id].correctAttempts++
      acc[attempt.chapter_id].timeSpent += attempt.time_taken || 0
      return acc
    }, {})

    // Difficulty analysis
    const difficultyStats = attempts.reduce((acc, attempt) => {
      const difficulty = attempt.question_difficulty || 'Unknown'
      if (!acc[difficulty]) {
        acc[difficulty] = { total: 0, correct: 0 }
      }
      acc[difficulty].total++
      if (attempt.is_correct) acc[difficulty].correct++
      return acc
    }, {})

    // Time-based analysis (last 30 days)
    const last30Days = attempts.filter(a => {
      const attemptDate = new Date(a.attempted_at)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return attemptDate >= thirtyDaysAgo
    })

    const dailyProgress = last30Days.reduce((acc, attempt) => {
      const date = new Date(attempt.attempted_at).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { attempts: 0, correct: 0, date: new Date(attempt.attempted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
      }
      acc[date].attempts++
      if (attempt.is_correct) acc[date].correct++
      acc[date].accuracy = acc[date].attempts > 0 ? (acc[date].correct / acc[date].attempts) * 100 : 0
      return acc
    }, {})

    // Question type analysis
    const questionTypeStats = attempts.reduce((acc, attempt) => {
      const type = attempt.question_type || 'Unknown'
      if (!acc[type]) {
        acc[type] = { total: 0, correct: 0 }
      }
      acc[type].total++
      if (attempt.is_correct) acc[type].correct++
      return acc
    }, {})

    // Weekly progress for line chart
    const weeklyProgress = Object.entries(dailyProgress)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-7)
      .map(([date, data]) => ({
        date: data.date,
        attempts: data.attempts,
        accuracy: Math.round(data.accuracy),
        correct: data.correct
      }))

    return {
      overall: {
        totalAttempts,
        correctAttempts,
        accuracy: Math.round(accuracy * 100) / 100,
        avgTimePerQuestion: Math.round(avgTimePerQuestion),
        totalTimeSpent: totalTimeTaken,
        bookmarks: attempts.filter(a => a.is_bookmarked).length,
        flagged: attempts.filter(a => a.is_flagged).length
      },
      subjects: subjectStats.sort((a, b) => b.totalAttempts - a.totalAttempts),
      chapters: chapterStats,
      difficulty: difficultyStats,
      dailyProgress: Object.values(dailyProgress).slice(-7),
      weeklyProgress,
      questionTypes: questionTypeStats,
      recentActivity: attempts
        .sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at))
        .slice(0, 10)
    }
  }, [attempts, subjects])

  return { analytics, isLoading: isLoading || !analytics }
}

// Custom Tooltip Components
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold text-sm">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}{entry.name.includes('Accuracy') ? '%' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-white font-semibold text-sm">{payload[0].name}</p>
        <p className="text-sm text-slate-300">
          Questions: {payload[0].value}
        </p>
        <p className="text-sm text-slate-300">
          {Math.round((payload[0].value / payload[0].payload.total) * 100)}%
        </p>
      </div>
    )
  }
  return null
}

// Components
const StatCard = ({ icon: Icon, title, value, subtitle, color = "purple", trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 sm:p-6 hover:border-slate-600 transition-all duration-300 group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-white mb-1">{value}</p>
        {subtitle && (
          <p className={`text-xs sm:text-sm ${
            color === 'green' ? 'text-green-400' :
            color === 'red' ? 'text-red-400' :
            color === 'blue' ? 'text-blue-400' : 'text-slate-400'
          }`}>
            {subtitle}
          </p>
        )}
      </div>
      <div className={`p-2 sm:p-3 rounded-xl bg-${color}-500/20 border border-${color}-500/30 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-400`} />
      </div>
    </div>
    {trend && (
      <div className={`flex items-center mt-2 text-xs ${
        trend > 0 ? 'text-green-400' : 'text-red-400'
      }`}>
        <FiTrendingUp className={`w-3 h-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
        {Math.abs(trend)}% from last week
      </div>
    )}
  </motion.div>
)

const ProgressBar = ({ percentage, color = "purple", label, value }) => (
  <div className="mb-4">
    <div className="flex justify-between text-sm text-slate-300 mb-2">
      <span>{label}</span>
      <span>{value}</span>
    </div>
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${
          color === 'green' ? 'bg-green-500' :
          color === 'red' ? 'bg-red-500' :
          color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
)

const SubjectCard = ({ subject, onSelect }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onSelect}
    className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 sm:p-6 hover:border-purple-500/50 cursor-pointer transition-all duration-300 group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
          <FiBookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-base sm:text-lg truncate">{subject.name}</h3>
          <p className="text-slate-400 text-xs sm:text-sm">{subject.totalAttempts} attempts</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-lg sm:text-xl font-bold text-white">{Math.round(subject.accuracy)}%</div>
        <div className="text-slate-400 text-xs sm:text-sm">Accuracy</div>
      </div>
    </div>
    
    <ProgressBar 
      percentage={subject.accuracy} 
      color={subject.accuracy >= 70 ? 'green' : subject.accuracy >= 50 ? 'blue' : 'red'}
      label="Accuracy"
      value={`${subject.correctAttempts}/${subject.totalAttempts} correct`}
    />
    
    <div className="flex justify-between text-xs sm:text-sm text-slate-400">
      <span>Time spent: {Math.round(subject.timeSpent / 60)}min</span>
      <span>Avg: {Math.round(subject.avgTime)}s/q</span>
    </div>
  </motion.div>
)

const AccuracyTrendChart = ({ weeklyProgress }) => (
  <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 sm:p-6">
    <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Accuracy Trend (Last 7 Days)</h3>
    <div className="h-64 sm:h-72 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={weeklyProgress} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={12}
            tickMargin={10}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="accuracy" 
            stroke="#8884d8" 
            fillOpacity={1} 
            fill="url(#accuracyGradient)" 
            name="Accuracy"
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="correct" 
            stroke="#10B981" 
            strokeWidth={2}
            name="Correct Answers"
            dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
)

const DifficultyPieChart = ({ difficultyStats }) => {
  const data = Object.entries(difficultyStats).map(([difficulty, stats]) => ({
    name: difficulty,
    value: stats.total,
    correct: stats.correct,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
    total: stats.total
  })).filter(item => item.value > 0)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Questions by Difficulty</h3>
      <div className="h-64 sm:h-72 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const DailyActivityChart = ({ dailyProgress }) => (
  <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 sm:p-6">
    <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Daily Activity</h3>
    <div className="h-64 sm:h-72 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dailyProgress} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={12}
            tickMargin={10}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{
              fontSize: '12px'
            }}
          />
          <Bar 
            dataKey="attempts" 
            fill="#8884d8" 
            name="Questions Attempted"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="correct" 
            fill="#00C49F" 
            name="Correct Answers"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)

const QuestionTypeChart = ({ questionTypes }) => {
  const data = Object.entries(questionTypes).map(([type, stats]) => ({
    name: type.replace(/_/g, ' ').toLowerCase(),
    attempts: stats.total,
    correct: stats.correct,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
  })).filter(item => item.attempts > 0)

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Performance by Question Type</h3>
      <div className="h-64 sm:h-72 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 80, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis 
              type="number" 
              stroke="#9CA3AF"
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tickMargin={10}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="#9CA3AF"
              width={70}
              tick={{ fontSize: 11 }}
              tickMargin={10}
            />
            <Tooltip 
              formatter={(value, name) => [name === 'accuracy' ? `${value}%` : value, name === 'accuracy' ? 'Accuracy' : 'Attempts']}
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151', 
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="accuracy" 
              fill="#8884d8" 
              name="accuracy"
              radius={[0, 4, 4, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.accuracy >= 70 ? '#10B981' : entry.accuracy >= 50 ? '#F59E0B' : '#EF4444'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const ContinuePracticingCTA = ({ exam, subjects, analytics }) => {
  const router = useRouter()
  
  // Find the subject with lowest accuracy or most attempts
  const weakestSubject = analytics.subjects
    .filter(subject => subject.totalAttempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy)[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8"
    >
     <div className="flex flex-col md:flex-row items-center justify-between">
  {/* Left Text */}
  <div className="flex-1 mb-4 md:mb-0">
    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
      Continue Your Practice
    </h3>
    <p className="text-purple-200 text-xs sm:text-sm mb-2">
      {weakestSubject 
        ? `Focus on ${weakestSubject.name} to improve your accuracy from ${Math.round(weakestSubject.accuracy)}%`
        : 'Start practicing to unlock detailed analytics'
      }
    </p>
    <p className="text-slate-300 text-xs sm:text-sm">
      {analytics.overall.totalAttempts > 0 
        ? `You've attempted ${analytics.overall.totalAttempts} questions with ${Math.round(analytics.overall.accuracy)}% accuracy`
        : 'Begin your preparation journey now'
      }
    </p>
  </div>

  {/* Button */}
  <button
    onClick={() => router.push(`/pyq/exams/${exam}`)}
    className="flex items-center space-x-2 bg-white text-purple-600 hover:bg-purple-50 px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg text-xs sm:text-base"
  >
    <FiPlay className="w-3 h-3 sm:w-5 sm:h-5" />
    <span>Continue Practicing</span>
    <FiArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
  </button>
</div>

    </motion.div>
  )
}

export default function ExamAnalysisPage({ dehydratedState, examSlug }) {
  const router = useRouter()
  const { exam } = router.query
  const { user, loading: authLoading } = useAuth()
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)

  const {
    data: examData,
    error: examError,
    isLoading: examLoading
  } = useExamData(exam || examSlug, !!user)

  const {
    data: subjects = [],
    isLoading: subjectsLoading
  } = useSubjects(examData?.id, !!examData?.id)

  const { analytics, isLoading: analyticsLoading } = useExamAnalytics(user?.id, examData?.id)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || examLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center px-4">
          <FiBarChart2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Data Available</h1>
          <p className="text-gray-300 mb-6">Start attempting questions to see your analytics</p>
          <button
            onClick={() => router.push(`/pyq/exams/${exam}`)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors mx-auto"
          >
            <FiPlay className="w-5 h-5" />
            <span>Start Practicing</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <HydrationBoundary state={dehydratedState}>
      <Head>
        <title>{examData?.name} Analysis | Study Platform</title>
        <meta name="description" content={`Detailed analytics for ${examData?.name}`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-slate-900 to-slate-900"></div>
        
        {/* Header */}
        <div className="relative z-10 bg-slate-900 backdrop-blur-lg border-b border-slate-700 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <button
                  onClick={() => router.push(`/pyq/exams/${exam}`)}
                  className="flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200"
                >
                  <FiMenu className="w-4 h-4 text-white" />
                </button>

                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  {examData?.logo_url ? (
                    <img 
                      src={examData.logo_url} 
                      alt={examData.name}
                      className="w-4 h-4 sm:w-6 sm:h-6 object-contain"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm sm:text-lg">
                      {examData?.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                    {examData?.name} Analysis
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm md:text-base truncate">
                    Detailed performance insights and analytics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Continue Practicing CTA */}
          <ContinuePracticingCTA 
            exam={exam} 
            subjects={subjects} 
            analytics={analytics} 
          />

          {/* Overview Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8"
          >
            <StatCard
              icon={FiTarget}
              title="Overall Accuracy"
              value={`${analytics.overall.accuracy}%`}
              subtitle={`${analytics.overall.correctAttempts}/${analytics.overall.totalAttempts} correct`}
              color={analytics.overall.accuracy >= 70 ? 'green' : analytics.overall.accuracy >= 50 ? 'blue' : 'red'}
            />
            <StatCard
              icon={FiClock}
              title="Average Time"
              value={`${analytics.overall.avgTimePerQuestion}s`}
              subtitle="Per question"
              color="blue"
            />
            <StatCard
              icon={FiTrendingUp}
              title="Total Questions"
              value={analytics.overall.totalAttempts}
              subtitle="Attempted"
              color="purple"
            />
            <StatCard
              icon={FiAward}
              title="Bookmarks"
              value={analytics.overall.bookmarks}
              subtitle={`${analytics.overall.flagged} flagged`}
              color="green"
            />
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Charts */}
            <div className="xl:col-span-2 space-y-6">
              {/* Accuracy Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <AccuracyTrendChart weeklyProgress={analytics.weeklyProgress} />
              </motion.div>

              {/* Daily Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DailyActivityChart dailyProgress={analytics.dailyProgress} />
              </motion.div>

              {/* Question Type Analysis */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <QuestionTypeChart questionTypes={analytics.questionTypes} />
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Difficulty Pie Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <DifficultyPieChart difficultyStats={analytics.difficulty} />
              </motion.div>

              {/* Subjects Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4 sm:p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Subject Performance</h3>
                <div className="space-y-3 sm:space-y-4">
                  {analytics.subjects.slice(0, 4).map((subject, index) => (
                    <div key={subject.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiBookOpen className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">{subject.name}</p>
                          <p className="text-slate-400 text-xs">{subject.totalAttempts} attempts</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className={`text-sm font-semibold ${
                          subject.accuracy >= 70 ? 'text-green-400' : 
                          subject.accuracy >= 50 ? 'text-blue-400' : 'text-red-400'
                        }`}>
                          {Math.round(subject.accuracy)}%
                        </div>
                        <div className="text-slate-400 text-xs">Accuracy</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </HydrationBoundary>
  )
}