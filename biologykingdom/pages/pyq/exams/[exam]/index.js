// pages/pyq/exams/[exam]/index.js
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { queryClient } from '../../../../lib/react-query'
import { useExamData, useSubjects, useChaptersWithStats } from '../../../../hooks/useExamData'
import { useAuth } from '../../../../hooks/useAuth'
import { useUserQuestionAttempts } from '../../../../hooks/useUserQuestionAttempts'
import { FiFilter, FiX, FiChevronRight, FiBook, FiBarChart2, FiClock, FiLoader, FiCircle, FiMenu } from 'react-icons/fi'

const difficultyCategories = [
  'All Categories',
  'High Output High Input',
  'High Output Low Input', 
  'Low Output Low Input',
  'Low Output High Input'
]

const yearRange = Array.from({ length: 18 }, (_, i) => 2025 - i)

// Skeleton Loaders
const ChapterRowSkeleton = () => (
  <div className="w-full bg-gray-700/50 border border-gray-600 rounded-xl p-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4 flex-1">
        <div className="h-10 w-10 bg-gray-600 rounded-full"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
      <div className="flex space-x-6">
        <div className="text-right">
          <div className="h-5 bg-gray-600 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-600 rounded w-12"></div>
        </div>
        <div className="text-right">
          <div className="h-5 bg-gray-600 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-600 rounded w-12"></div>
        </div>
        <div className="text-right">
          <div className="h-5 bg-gray-600 rounded w-20 mb-1"></div>
          <div className="h-4 bg-gray-600 rounded w-16"></div>
        </div>
      </div>
    </div>
  </div>
)

const SubjectSkeleton = () => (
  <div className="space-y-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="w-full p-4 rounded-xl bg-gray-700/50 animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-600 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-600 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

// Update the hooks to use the correct query structure
const useChaptersWithStatsClient = (subjectId, enabled = true) => {
  return useChaptersWithStats(subjectId, enabled)
}

export default function ExamPYQPage({ dehydratedState, examSlug, initialSubjectId, error: initialError }) {
  const router = useRouter()
  const { exam } = router.query
  const { user, loading: authLoading } = useAuth()
  
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId)
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Categories')
  const [selectedYears, setSelectedYears] = useState([])
  const [showSortPanel, setShowSortPanel] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [sortBy, setSortBy] = useState('name')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Data fetching with React Query
  const {
    data: examData,
    error: examError,
    isLoading: examLoading
  } = useExamData(exam || examSlug, !!user)

  const {
    data: subjects = [],
    error: subjectsError,
    isLoading: subjectsLoading
  } = useSubjects(examData?.id, !!examData?.id)

  const {
    data: chapters = [],
    error: chaptersError,
    isLoading: chaptersLoading,
    isFetching: chaptersFetching
  } = useChaptersWithStatsClient(selectedSubjectId, !!selectedSubjectId)

  // Get user attempts for all chapters
  const {
    data: userAttempts = [],
    isLoading: attemptsLoading
  } = useUserQuestionAttempts(user?.id, selectedSubjectId)

  // Calculate attempted counts for each chapter
  const chapterAttempts = useMemo(() => {
    const attemptsMap = {}
    userAttempts.forEach(attempt => {
      if (!attemptsMap[attempt.chapter_id]) {
        attemptsMap[attempt.chapter_id] = new Set()
      }
      attemptsMap[attempt.chapter_id].add(attempt.question_id)
    })
    
    const counts = {}
    Object.keys(attemptsMap).forEach(chapterId => {
      counts[chapterId] = attemptsMap[chapterId].size
    })
    
    return counts
  }, [userAttempts])

  // Auto-select first subject if available
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id)
    }
  }, [subjects, selectedSubjectId])

  // Filter and sort chapters
  const filteredAndSortedChapters = useMemo(() => {
    let filtered = chapters

    // Apply difficulty filter
    if (selectedDifficulty !== 'All Categories') {
      filtered = filtered.filter(chapter => 
        chapter.difficultyStats[selectedDifficulty] > 0
      )
    }

    // Apply year filter
    if (selectedYears.length > 0) {
      filtered = filtered.filter(chapter =>
        chapter.recentStats.some(stat => selectedYears.includes(stat.year))
      )
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'questions':
          return b.totalQuestions - a.totalQuestions
        case 'recent':
          const aRecent = a.recentStats.reduce((sum, stat) => sum + stat.count, 0)
          const bRecent = b.recentStats.reduce((sum, stat) => sum + stat.count, 0)
          return bRecent - aRecent
        default:
          return a.order - b.order
      }
    })
  }, [chapters, selectedDifficulty, selectedYears, sortBy])

  const toggleYear = (year) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    )
  }

  const selectAllYears = () => setSelectedYears(yearRange)
  const clearAllYears = () => setSelectedYears([])

  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId)
    setShowMobileSidebar(false)
    // Clear filters when changing subject
    setSelectedDifficulty('All Categories')
    setSelectedYears([])
  }

  const applySortAndClose = () => setShowSortPanel(false)

  // Error states
  const error = initialError || examError || subjectsError || chaptersError

  // Loading state
  if (authLoading || examLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Exam Not Found</h1>
          <p className="text-gray-300">The requested exam could not be found.</p>
        </div>
      </div>
    )
  }

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId)

  return (
    <HydrationBoundary state={dehydratedState}>
      <Head>
        <title>{examData.name} PYQs | Study Platform</title>
        <meta name="description" content={`Previous Year Questions for ${examData.name}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .year-filter::-webkit-scrollbar {
          width: 4px;
        }
        .year-filter::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 2px;
        }
        .year-filter::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 2px;
        }
        .year-filter::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-800">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-slate-900 to-slate-900"></div>
        
        {/* Header */}
        <div className="relative z-10 bg-slate-900 backdrop-blur-lg border-b border-slate-700 shadow-xl">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <button
                  onClick={() => router.push('/')}
                  className="flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden flex-shrink-0 p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all duration-200"
                >
                  <FiMenu className="w-4 h-4 text-white" />
                </button>

                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  {examData.logo_url ? (
                    <img 
                      src={examData.logo_url} 
                      alt={examData.name}
                      className="w-5 h-5 sm:w-7 sm:h-7 object-contain"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm sm:text-lg">
                      {examData.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate font-poppins">
                    {examData.name} PYQs
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm md:text-base truncate">
                    Master your preparation with previous year questions
                  </p>
                </div>
              </div>
              
              {/* Sort Button */}
              <button
                onClick={() => setShowSortPanel(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 sm:px-4 sm:py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg flex-shrink-0 group ml-2"
              >
                <FiFilter className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:rotate-12 transition-transform" />
                <span className="text-white text-xs sm:text-sm font-semibold hidden sm:block">Sort & Filter</span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex gap-4 lg:gap-8">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
              {showMobileSidebar && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileSidebar(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                  />
                  
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-slate-700 z-50 overflow-y-auto shadow-2xl lg:hidden"
                  >
                    <SidebarContent 
                      examData={examData}
                      subjects={subjects}
                      selectedSubjectId={selectedSubjectId}
                      onSubjectChange={handleSubjectChange}
                      exam={exam}
                      router={router}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl p-6 h-[calc(100vh-8rem)] sticky top-24 shadow-xl overflow-hidden flex flex-col">
                <SidebarContent 
                  examData={examData}
                  subjects={subjects}
                  selectedSubjectId={selectedSubjectId}
                  onSubjectChange={handleSubjectChange}
                  exam={exam}
                  router={router}
                />
              </div>
            </div>

            {/* Main Content - Enhanced Chapter List */}
            <div className="flex-1 min-w-0">
              {selectedSubject && (
                <div className="bg-slate-800 backdrop-blur-lg  border-slate-700 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl">
                  {/* Enhanced Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 space-y-3 lg:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-poppins truncate">
                          {selectedSubject.name}
                        </h2>
                        {chaptersFetching && (
                          <FiLoader className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 animate-spin" />
                        )}
                      </div>
                      <p className="text-slate-400 text-sm sm:text-base">
                        {filteredAndSortedChapters.length} chapters • 
                        {' '}{filteredAndSortedChapters.reduce((total, chapter) => total + chapter.totalQuestions, 0)} questions
                        {chaptersFetching && ' • Loading...'}
                      </p>
                    </div>
                    
                    {/* Active Filters */}
                    <div className="flex flex-wrap gap-2">
                      {(selectedDifficulty !== 'All Categories' || selectedYears.length > 0) && (
                        <>
                          {selectedDifficulty !== 'All Categories' && (
                            <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-2">
                              <span className="text-purple-300 text-xs sm:text-sm font-medium">
                                {selectedDifficulty}
                              </span>
                            </div>
                          )}
                          {selectedYears.length > 0 && (
                            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg sm:rounded-xl px-2 py-1 sm:px-3 sm:py-2">
                              <span className="text-blue-300 text-xs sm:text-sm font-medium">
                                {selectedYears.length} years
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Chapters List - Responsive Rows */}
                  <div className="space-y-3 sm:space-y-4">
                    {chaptersLoading ? (
                      // Show skeletons while loading
                      [...Array(6)].map((_, index) => (
                        <ChapterRowSkeleton key={index} />
                      ))
                    ) : filteredAndSortedChapters.length > 0 ? (
                      // Show actual chapters in rows
                      filteredAndSortedChapters.map((chapter, index) => {
                        const lastYearStat = chapter.recentStats[0]
                        const secondLastYearStat = chapter.recentStats[1]
                        const attemptedCount = chapterAttempts[chapter.id] || 0
                        
                        return (
                          <motion.div
                            key={chapter.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ 
                              scale: 1.01,
                              transition: { duration: 0.2 }
                            }}
                            className="group cursor-pointer"
                            onClick={() => router.push(`/pyq/exams/${exam}/${selectedSubject.slug}/${chapter.slug}`)}
                          >
                            <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-2 border-slate-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-purple-500/50 hover:shadow-lg sm:hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 group relative overflow-hidden">
                              {/* Background Glow Effect */}
                              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              <div className="relative z-10">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                                  {/* Chapter Info */}
                                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                                      <FiCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-purple-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h3 className="font-bold text-white group-hover:text-purple-200 transition-colors truncate text-sm sm:text-base md:text-lg font-poppins">
                                        {chapter.name}
                                      </h3>
                                      <p className="text-slate-400 text-xs sm:text-sm truncate">
                                        Chapter {chapter.order}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Stats */}
                                  <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-6 lg:space-x-8">
                                    {/* Last Year Questions */}
                                    {lastYearStat && (
                                      <div className="text-right">
                                        <div className="text-xs sm:text-sm md:text-base font-semibold text-white">
                                          {lastYearStat.year}: {lastYearStat.count} Qs
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-slate-400">
                                          Last Year
                                        </div>
                                      </div>
                                    )}

                                    {/* Second Last Year Questions */}
                                    {secondLastYearStat && (
                                      <div className="text-right">
                                        <div className="text-xs sm:text-sm md:text-base font-semibold text-white">
                                          {secondLastYearStat.year}: {secondLastYearStat.count} Qs
                                        </div>
                                        <div className="text-[10px] sm:text-xs text-slate-400">
                                          Previous Year
                                        </div>
                                      </div>
                                    )}

                                    <div className="text-right">
                                      <div className="text-xs sm:text-sm md:text-base font-semibold text-white">
                                        {attemptedCount}/{chapter.totalQuestions} Qs
                                      </div>
                                      <div className="text-[10px] sm:text-xs text-slate-400">
                                        Attempted
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    ) : (
                      // Empty state
                      <div className="text-center py-12 sm:py-16">
                        <div className="text-slate-400 text-lg sm:text-xl font-medium mb-2 sm:mb-3">No chapters found</div>
                        <div className="text-slate-500 text-sm sm:text-base">
                          {chapters.length === 0 
                            ? 'No chapters available for this subject'
                            : 'Try adjusting your filters or select a different subject'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Sort Panel */}
        <AnimatePresence>
          {showSortPanel && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSortPanel(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-full max-w-sm sm:max-w-md bg-slate-900 border-r border-slate-700 z-50 overflow-y-auto shadow-2xl"
              >
                <div className="p-4 sm:p-6 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-poppins">Sort & Filter</h2>
                    <button
                      onClick={() => setShowSortPanel(false)}
                      className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      <FiX className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-6 sm:space-y-8">
                    {/* Sort By */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 font-poppins">Sort By</h3>
                      <div className="space-y-2 sm:space-y-3">
                        {[
                          { value: 'name', label: 'Chapter Name', icon: '📝', desc: 'Alphabetical order' },
                          { value: 'questions', label: 'Total Questions', icon: '❓', desc: 'Most questions first' },
                          { value: 'recent', label: 'Recent Questions', icon: '🕒', desc: 'Latest patterns first' },
                          { value: 'default', label: 'Default Order', icon: '🔢', desc: 'Original chapter order' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSortBy(option.value)}
                            className={`w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 border-2 ${
                              sortBy === option.value
                                ? 'bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-500/25'
                                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <span className="text-xl sm:text-2xl">{option.icon}</span>
                              <div className="flex-1">
                                <div className={`font-semibold text-sm sm:text-base ${
                                  sortBy === option.value ? 'text-white' : 'text-slate-200'
                                }`}>
                                  {option.label}
                                </div>
                                <div className={`text-xs sm:text-sm ${
                                  sortBy === option.value ? 'text-purple-300' : 'text-slate-400'
                                }`}>
                                  {option.desc}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty Filter */}
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 font-poppins">Difficulty Category</h3>
                      <div className="space-y-2 sm:space-y-3">
                        {difficultyCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedDifficulty(category)}
                            className={`w-full text-left p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-200 border-2 ${
                              selectedDifficulty === category
                                ? 'bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-500/25'
                                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span className={`font-medium text-sm sm:text-base ${
                              selectedDifficulty === category ? 'text-white' : 'text-slate-200'
                            }`}>
                              {category}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Year Filter */}
                    <div>
                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-white font-poppins">Select Years</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={selectAllYears}
                            className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 font-medium px-2 py-1 sm:px-3 sm:py-1 bg-purple-600/20 rounded-lg transition-colors"
                          >
                            All
                          </button>
                          <button
                            onClick={clearAllYears}
                            className="text-xs sm:text-sm text-slate-400 hover:text-slate-300 font-medium px-2 py-1 sm:px-3 sm:py-1 bg-slate-700 rounded-lg transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                      <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-1 sm:space-y-2 year-filter border-2 border-slate-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-slate-800">
                        {yearRange.map((year) => (
                          <label key={year} className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:bg-slate-700 px-2 py-2 sm:px-3 sm:py-3 rounded-lg sm:rounded-xl transition-colors group">
                            <input
                              type="checkbox"
                              checked={selectedYears.includes(year)}
                              onChange={() => toggleYear(year)}
                              className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 w-3 h-3 sm:w-4 sm:h-4"
                            />
                            <span className="text-slate-200 text-xs sm:text-sm flex-1 group-hover:text-white">{year}</span>
                            {selectedYears.includes(year) && (
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full"></div>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={applySortAndClose}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:scale-105 font-poppins mt-6 sm:mt-8 shadow-lg text-sm sm:text-base"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </HydrationBoundary>
  )
}

// Sidebar Content Component
const SidebarContent = ({ examData, subjects, selectedSubjectId, onSubjectChange, exam, router }) => {
  return (
    <>
      {/* Exam Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
          {examData?.logo_url && (
            <img src={examData.logo_url} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" alt={examData.name} />
          )}
          <span>{examData?.name}</span>
        </h1>
        <p className="text-slate-400 mt-2 text-xs sm:text-sm">
          {examData?.year_range} • {examData?.total_papers} Papers • {examData?.total_questions} Qs
        </p>
      </div>

      {/* Subjects List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {subjects?.map((sub) => {
          const isActive = selectedSubjectId === sub.id
          return (
            <div
              key={sub.id}
              onClick={() => onSubjectChange(sub.id)}
              className={`w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "bg-slate-700/40 text-slate-300 hover:bg-slate-700/70"
              }`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className={`text-lg sm:text-xl ${sub.color || "text-blue-400"}`}>
                  {sub.icon ? <img src={sub.icon} className="w-4 h-4 sm:w-5 sm:h-5" alt="" /> : <FiCircle />}
                </span>
                <span className="text-sm sm:text-base">{sub.name}</span>
              </div>
              {sub.badge && (
                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
                  {sub.badge}
                </span>
              )}
            </div>
          )
        })}

        {/* Analysis Item */}
        <div
          onClick={() => router.push(`/pyq/exams/${exam}/analysis`)}
          className={`w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${
            router.pathname.includes("/analysis")
              ? "bg-white text-black font-semibold shadow-lg"
              : "bg-slate-700/40 text-slate-300 hover:bg-slate-700/70"
          }`}
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <FiBarChart2 className="text-lg sm:text-xl text-cyan-400" />
            <span className="text-sm sm:text-base">Analysis</span>
          </div>
          <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full">
            NEW
          </span>
        </div>
      </div>
    </>
  )
}