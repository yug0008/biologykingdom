import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AvatarUploader from '../components/AvatarUploader'
import Button from '../components/Button'
import { 
  FiSettings, 
  FiLogOut, 
  FiShoppingBag, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiBook, 
  FiCalendar,
  FiTarget,
  FiAward,
  FiTrendingUp,
  FiCheckCircle,
  FiPlay,
  FiPause,
  FiStar
} from 'react-icons/fi'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [streakData, setStreakData] = useState({
    daily: { attempted: 0, correct: 0, incorrect: 0, target: 10 },
    weekly: [],
    currentStreak: 0,
    longestStreak: 0
  })
  const [showAchievement, setShowAchievement] = useState(false)
  const [achievementMessage, setAchievementMessage] = useState('')
  const [targetModal, setTargetModal] = useState(false)
  const [dailyTarget, setDailyTarget] = useState(10)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login')
      return
    }
    
    if (user && !authLoading) {
      fetchProfile()
      fetchStreakData()
      fetchUserTarget()
      checkDailyAchievement()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    try {
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        const newProfile = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          profile_pic_url: user.user_metadata?.avatar_url,
          phone: user.user_metadata?.phone || '',
          exams: user.user_metadata?.exams || [],
          created_at: new Date().toISOString()
        }

        const { data: insertedData } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single()

        data = insertedData
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        profile_pic_url: user.user_metadata?.avatar_url,
        phone: user.user_metadata?.phone || '',
        exams: user.user_metadata?.exams || [],
        created_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStreakData = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get today's attempts
      const { data: todayAttempts, error: todayError } = await supabase
        .from('user_question_attempts')
        .select('is_correct')
        .eq('user_id', user.id)
        .gte('attempted_at', `${today}T00:00:00`)
        .lt('attempted_at', `${today}T23:59:59`)

      if (todayError) throw todayError

      const todayStats = {
        attempted: todayAttempts?.length || 0,
        correct: todayAttempts?.filter(attempt => attempt.is_correct === true).length || 0,
        incorrect: todayAttempts?.filter(attempt => attempt.is_correct === false).length || 0
      }

      // Get weekly data (last 7 days)
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - 6)
      weekStart.setHours(0, 0, 0, 0)

      const { data: weeklyAttempts, error: weeklyError } = await supabase
        .from('user_question_attempts')
        .select('attempted_at, is_correct')
        .eq('user_id', user.id)
        .gte('attempted_at', weekStart.toISOString())
        .order('attempted_at', { ascending: true })

      if (weeklyError) throw weeklyError

      // Calculate streaks from all attempts
      const { data: allAttempts, error: allError } = await supabase
        .from('user_question_attempts')
        .select('attempted_at')
        .eq('user_id', user.id)
        .order('attempted_at', { ascending: false })

      if (allError) throw allError

      // Calculate current streak and longest streak
      const { currentStreak, longestStreak } = calculateStreaks(allAttempts)

      // Format weekly data
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const formattedWeeklyData = daysOfWeek.map(day => {
        const dayIndex = daysOfWeek.indexOf(day)
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() - (6 - dayIndex))
        targetDate.setHours(0, 0, 0, 0)
        
        const nextDay = new Date(targetDate)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const dayAttempts = weeklyAttempts?.filter(attempt => {
          const attemptDate = new Date(attempt.attempted_at)
          return attemptDate >= targetDate && attemptDate < nextDay
        }) || []

        return {
          day,
          attempted: dayAttempts.length,
          correct: dayAttempts.filter(attempt => attempt.is_correct === true).length,
          incorrect: dayAttempts.filter(attempt => attempt.is_correct === false).length,
          targetAchieved: dayAttempts.length >= dailyTarget
        }
      })

      setStreakData({
        daily: {
          ...todayStats,
          target: dailyTarget
        },
        weekly: formattedWeeklyData,
        currentStreak,
        longestStreak
      })

    } catch (error) {
      console.error('Error fetching streak data:', error)
    }
  }

  const calculateStreaks = (attempts) => {
    if (!attempts || attempts.length === 0) {
      return { currentStreak: 0, longestStreak: 0 }
    }

    // Get unique dates with attempts
    const uniqueDates = [...new Set(
      attempts.map(attempt => new Date(attempt.attempted_at).toDateString())
    )].sort((a, b) => new Date(b) - new Date(a))

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date().toDateString()
    let lastDate = new Date()

    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i])
      const diffTime = Math.abs(lastDate - currentDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1 || (i === 0 && currentDate.toDateString() === today)) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else if (diffDays > 1) {
        if (currentStreak === 0) {
          currentStreak = tempStreak
        }
        tempStreak = 1
      }

      lastDate = currentDate
    }

    currentStreak = currentStreak === 0 ? tempStreak : currentStreak

    return { currentStreak, longestStreak }
  }

  const fetchUserTarget = async () => {
    if (!user) return

    try {
      // Since we don't have a targets table, we can use user metadata or localStorage
      // For now, we'll use localStorage. You can create a targets table later if needed.
      const savedTarget = localStorage.getItem(`daily_target_${user.id}`)
      if (savedTarget) {
        const target = parseInt(savedTarget)
        setDailyTarget(target)
        setStreakData(prev => ({
          ...prev,
          daily: { ...prev.daily, target }
        }))
      }
    } catch (error) {
      console.error('Error fetching user target:', error)
    }
  }

  const checkDailyAchievement = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: todayAttempts } = await supabase
        .from('user_question_attempts')
        .select('id')
        .eq('user_id', user.id)
        .gte('attempted_at', `${today}T00:00:00`)
        .lt('attempted_at', `${today}T23:59:59`)

      if (todayAttempts && todayAttempts.length >= dailyTarget) {
        const lastShown = localStorage.getItem(`achievement_shown_${today}_${user.id}`)
        if (!lastShown) {
          showAchievementNotification('Daily Target Achieved!', `You've completed ${dailyTarget} questions today! 🎉`)
          localStorage.setItem(`achievement_shown_${today}_${user.id}`, 'true')
        }
      }
    } catch (error) {
      console.error('Error checking achievement:', error)
    }
  }

  const showAchievementNotification = (title, message) => {
    setAchievementMessage({ title, message })
    setShowAchievement(true)
    
    // Play notification sound
    const audio = new Audio('/achievement-sound.mp3')
    audio.play().catch(() => {}) // Ignore errors if audio fails
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setShowAchievement(false)
    }, 5000)
  }

  const updateDailyTarget = async () => {
    if (!user) return

    try {
      // Save to localStorage for now. You can create a targets table later.
      localStorage.setItem(`daily_target_${user.id}`, dailyTarget.toString())
      
      setStreakData(prev => ({
        ...prev,
        daily: { ...prev.daily, target: dailyTarget }
      }))
      setTargetModal(false)
      showAchievementNotification('Target Updated!', `Daily target set to ${dailyTarget} questions!`)
    } catch (error) {
      console.error('Error updating target:', error)
    }
  }

  const handleAvatarUpload = async (url) => {
    try {
      await supabase
        .from('users')
        .update({ 
          profile_pic_url: url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      setProfile(prev => ({ ...prev, profile_pic_url: url }))
    } catch (error) {
      console.error('Error updating profile picture:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const goToSettings = () => {
    router.push('/settings')
  }

  const getProgressPercentage = (attempted, target) => {
    return Math.min((attempted / target) * 100, 100)
  }

  const getDayColor = (attempted, target) => {
    const percentage = (attempted / target) * 100
    if (percentage >= 100) return 'from-green-500 to-emerald-400'
    if (percentage >= 50) return 'from-yellow-500 to-orange-400'
    return 'from-gray-600 to-gray-400'
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading your profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl mb-4">Profile Not Found</h2>
          <Button onClick={fetchProfile}>
            Retry Loading Profile
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Achievement Notification */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 max-w-md mx-4 text-center text-white shadow-2xl"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">{achievementMessage.title}</h3>
              <p className="text-lg mb-6">{achievementMessage.message}</p>
              <Button
                onClick={() => setShowAchievement(false)}
                className="bg-white text-orange-500 hover:bg-gray-100"
              >
                Continue Learning
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target Setting Modal */}
      <AnimatePresence>
        {targetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-white mb-4">Set Daily Target</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">
                    Questions per day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(parseInt(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setTargetModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateDailyTarget}
                    className="flex-1"
                  >
                    Set Target
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dark Background with subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900"></div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl"
                >
                  <div className="text-center mb-6">
                    <AvatarUploader 
                      url={profile.profile_pic_url} 
                      onUpload={handleAvatarUpload}
                      size={120}
                    />
                  </div>
                  
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {profile.name}
                    </h2>
                    <p className="text-gray-300">{profile.email}</p>
                    {profile.created_at && (
                      <p className="text-gray-500 text-sm mt-2">
                        Member since {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={goToSettings}
                      className="w-full flex items-center justify-center gap-2 py-3"
                    >
                      <FiSettings className="w-5 h-5" />
                      Edit Profile 
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center justify-center gap-2 py-3"
                    >
                      <FiShoppingBag className="w-5 h-5" />
                      Purchases
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-3"
                    >
                      <FiLogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </div>
                </motion.div>

                {/* Streak Stats Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl mt-6"
                >
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FiTrendingUp className="w-5 h-5 text-purple-400" />
                    Streak Stats
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Current Streak</span>
                      <span className="text-white font-bold text-lg">
                        {streakData.currentStreak} days 🔥
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Longest Streak</span>
                      <span className="text-white font-bold text-lg">
                        {streakData.longestStreak} days ⭐
                      </span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                      <Button
                        onClick={() => setTargetModal(true)}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <FiTarget className="w-4 h-4" />
                        Set Daily Target
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Daily Progress Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <FiPlay className="w-5 h-5 text-green-400" />
                      Today's Progress
                    </h3>
                    <span className="text-gray-400 text-sm">
                      {streakData.daily.attempted}/{streakData.daily.target} questions
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>Daily Target</span>
                      <span>{Math.round(getProgressPercentage(streakData.daily.attempted, streakData.daily.target))}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(streakData.daily.attempted, streakData.daily.target)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-4 rounded-full bg-gradient-to-r ${
                          getProgressPercentage(streakData.daily.attempted, streakData.daily.target) >= 100 
                            ? 'from-green-500 to-emerald-400' 
                            : 'from-purple-500 to-pink-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        {streakData.daily.attempted}
                      </div>
                      <div className="text-gray-400 text-sm">Attempted</div>
                    </div>
                    <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        {streakData.daily.correct}
                      </div>
                      <div className="text-gray-400 text-sm">Correct</div>
                    </div>
                    <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                      <div className="text-2xl font-bold text-red-400">
                        {streakData.daily.incorrect}
                      </div>
                      <div className="text-gray-400 text-sm">Incorrect</div>
                    </div>
                  </div>
                </motion.div>

                {/* Weekly Progress Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl"
                >
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FiTrendingUp className="w-5 h-5 text-yellow-400" />
                    Weekly Progress
                  </h3>

                  <div className="grid grid-cols-7 gap-2">
                    {streakData.weekly.map((day, index) => (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="text-center"
                      >
                        <div className={`h-16 rounded-lg bg-gradient-to-b ${getDayColor(day.attempted, streakData.daily.target)} 
                          flex items-center justify-center mb-2 relative`}
                        >
                          {day.targetAchieved && (
                            <FiStar className="w-4 h-4 text-yellow-300 absolute -top-1 -right-1" />
                          )}
                          <span className="text-white font-bold text-sm">
                            {day.attempted}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs">
                          {day.day}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Original Profile Info Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl"
                >
                  <div className="space-y-6">
                    {/* Name */}
                    <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <FiUser className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Full Name</h3>
                        <p className="text-white text-lg">{profile.name}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
                      <div className="p-2 bg-blue-600 rounded-lg">
                        <FiMail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Email Address</h3>
                        <p className="text-white text-lg truncate">
                          {profile.email}
                        </p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <FiPhone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Phone Number</h3>
                        <p className="text-white text-lg">{profile.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Exams */}
                    <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
                      <div className="p-2 bg-yellow-600 rounded-lg">
                        <FiBook className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Preparing For</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.exams && profile.exams.length > 0 ? (
                            profile.exams.map((exam) => (
                              <span
                                key={exam}
                                className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium"
                              >
                                {exam.toUpperCase()}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">No exams selected</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}