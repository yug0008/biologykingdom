// pages/pyq/exams/[exam]/[subject]/[chapter]/index.js
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../../../lib/supabase';
import { useAuth } from '../../../../../../hooks/useAuth';
import { 
  FiBook, 
  FiBarChart2, 
  FiStar, 
  FiXCircle, 
  FiCheckCircle,
  FiClock,
  FiList,
  FiFolder,
  FiBookmark,
  FiAlertTriangle,
  FiCalendar
} from 'react-icons/fi';

const menuItems = [
  { id: 'overview', label: 'Overview', icon: FiBarChart2 },
  { id: 'all-pyqs', label: 'All PYQs', icon: FiList },
  { id: 'topic-wise', label: 'Topic-wise PYQs', icon: FiFolder },
  { id: 'bookmarked', label: 'Bookmarked Qs', icon: FiBookmark },
  { id: 'mistakes', label: 'My Mistakes', icon: FiAlertTriangle }
];

// Format time spent
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Render question blocks (text, latex, image)
const renderQuestionBlocks = (blocks, maxLength = 100) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  let content = '';
  let currentLength = 0;

  for (const block of blocks) {
    if (currentLength >= maxLength) break;

    if (block.type === 'text') {
      const textToAdd = block.content.slice(0, maxLength - currentLength);
      content += textToAdd;
      currentLength += textToAdd.length;
    } else if (block.type === 'latex') {
      const latexSymbol = ' [LaTeX] ';
      if (currentLength + latexSymbol.length <= maxLength) {
        content += latexSymbol;
        currentLength += latexSymbol.length;
      }
    } else if (block.type === 'image') {
      const imageSymbol = ' [Image] ';
      if (currentLength + imageSymbol.length <= maxLength) {
        content += imageSymbol;
        currentLength += imageSymbol.length;
      }
    }
  }

  if (currentLength >= maxLength) {
    content += '...';
  }

  return content;
};

// Format exam date
const formatExamDate = (year, month) => {
  if (!year) return 'Unknown Date';
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = month ? monthNames[month - 1] : '';
  
  return monthName ? `${monthName} ${year}` : `${year}`;
};

export default function ChapterDetailPage() {
  const router = useRouter();
  const { exam, subject, chapter } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [examData, setExamData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [activeMenu, setActiveMenu] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch all data
  useEffect(() => {
    if (!exam || !subject || !chapter || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch exam data
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('slug', exam)
          .single();

        if (examError) throw examError;
        setExamData(examData);

        // Fetch subject data
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('*')
          .eq('slug', subject)
          .eq('exam_id', examData.id)
          .single();

        if (subjectError) throw subjectError;
        setSubjectData(subjectData);

        // Fetch chapter data
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .select('*')
          .eq('slug', chapter)
          .eq('subject_id', subjectData.id)
          .single();

        if (chapterError) throw chapterError;
        setChapterData(chapterData);

        // Fetch topics for this chapter
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('*')
          .eq('chapter_id', chapterData.id)
          .order('order');

        if (topicsError) throw topicsError;
        setTopics(topicsData);

        // Fetch questions for this chapter
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('chapter_id', chapterData.id)
          .eq('category', 'PYQ')
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (questionsError) throw questionsError;
        setQuestions(questionsData);

        // Fetch user progress
        await fetchUserProgress(chapterData.id);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load chapter data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exam, subject, chapter, user]);

  // Fetch user progress from Supabase
  const fetchUserProgress = async (chapterId) => {
    try {
      // Get user progress for this chapter
      const { data: progressData, error: progressError } = await supabase
        .from('user_chapter_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('Error fetching progress:', progressError);
      }

      if (progressData) {
        setUserProgress(progressData);
      } else {
        // Initialize progress if doesn't exist
        const newProgress = {
          user_id: user.id,
          chapter_id: chapterId,
          total_questions: questions.length,
          attempted_questions: 0,
          correct_questions: 0,
          incorrect_questions: 0,
          accuracy: 0,
          time_spent: 0,
          last_attempted: null,
          completed: false
        };
        setUserProgress(newProgress);
      }
    } catch (err) {
      console.error('Error in fetchUserProgress:', err);
    }
  };

  // Calculate derived progress stats
  const progressStats = useMemo(() => {
    if (!userProgress) return null;

    const accuracy = userProgress.attempted_questions > 0 
      ? Math.round((userProgress.correct_questions / userProgress.attempted_questions) * 100)
      : 0;

    const completionPercentage = userProgress.total_questions > 0
      ? Math.round((userProgress.attempted_questions / userProgress.total_questions) * 100)
      : 0;

    return {
      ...userProgress,
      accuracy,
      completionPercentage,
      timeSpentFormatted: formatTime(userProgress.time_spent)
    };
  }, [userProgress]);

  // Get question counts by topic
  const topicQuestionCounts = useMemo(() => {
    const counts = {};
    questions.forEach(question => {
      if (question.topic_id) {
        counts[question.topic_id] = (counts[question.topic_id] || 0) + 1;
      }
    });
    return counts;
  }, [questions]);

  // Get recent year stats
  const recentYearStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearCounts = {};
    
    questions.forEach(question => {
      if (question.year && question.year >= currentYear - 1) {
        yearCounts[question.year] = (yearCounts[question.year] || 0) + 1;
      }
    });

    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year)
      .slice(0, 2); // Last 2 years
  }, [questions]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
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
    );
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Chapter Not Found</h1>
          <p className="text-gray-300">The requested chapter could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{chapterData.name} | {subjectData?.name} | {examData?.name} | Study Platform</title>
        <meta name="description" content={`Practice ${chapterData.name} PYQs for ${examData?.name}`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900 to-gray-900"></div>
        
        {/* Header */}
        <div className="relative z-10 bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 min-w-0">
                <button
                  onClick={() => router.push(`/pyq/exams/${exam}`)}
                  className="flex-shrink-0 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                    <span>{examData?.name}</span>
                    <span>•</span>
                    <span>{subjectData?.name}</span>
                  </nav>
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate font-poppins">
                    {chapterData.name}
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 bg-gray-700/50 px-3 py-2 rounded-lg">
                  <FiBook className="w-4 h-4 text-purple-400" />
                  <span className="text-white text-sm font-medium">{questions.length} Questions</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 sticky top-24">
                {/* Chapter Info */}
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl border border-purple-500/30">
                  <h3 className="font-semibold text-white text-lg mb-2">{chapterData.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">Total Questions</span>
                      <span className="text-white font-semibold">{questions.length}</span>
                    </div>
                    {recentYearStats.map((stat, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-300 text-sm">{stat.year}</span>
                        <span className="text-green-400 font-semibold">{stat.count} Qs</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Menu */}
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveMenu(item.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-left ${
                        activeMenu === item.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                          : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent hover:border-gray-600'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${
                        activeMenu === item.id ? 'text-white' : 'text-gray-400'
                      }`} />
                      <span className={`font-medium ${
                        activeMenu === item.id ? 'text-white' : 'text-gray-200'
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-6">
                <AnimatePresence mode="wait">
                  {activeMenu === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Progress Overview */}
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-6 font-poppins">Your Progress</h2>
                        
                        {progressStats ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Attempted Questions */}
                            <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-300 text-sm">Attempted</span>
                                <FiCheckCircle className="w-5 h-5 text-blue-400" />
                              </div>
                              <div className="text-2xl font-bold text-white">{progressStats.attempted_questions}</div>
                              <div className="text-xs text-gray-400">out of {questions.length}</div>
                            </div>

                            {/* Correct Answers */}
                            <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-300 text-sm">Correct</span>
                                <FiCheckCircle className="w-5 h-5 text-green-400" />
                              </div>
                              <div className="text-2xl font-bold text-white">{progressStats.correct_questions}</div>
                              <div className="text-xs text-gray-400">answers</div>
                            </div>

                            {/* Incorrect Answers */}
                            <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-300 text-sm">Incorrect</span>
                                <FiXCircle className="w-5 h-5 text-red-400" />
                              </div>
                              <div className="text-2xl font-bold text-white">{progressStats.incorrect_questions}</div>
                              <div className="text-xs text-gray-400">answers</div>
                            </div>

                            {/* Accuracy */}
                            <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-300 text-sm">Accuracy</span>
                                <FiBarChart2 className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="text-2xl font-bold text-white">{progressStats.accuracy}%</div>
                              <div className="text-xs text-gray-400">success rate</div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-6 text-center">
                            <FiBarChart2 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">No Progress Yet</h3>
                            <p className="text-gray-400 text-sm">Start practicing to track your progress</p>
                          </div>
                        )}

                        {/* Progress Bar */}
                        {progressStats && (
                          <div className="bg-gray-700/50 border border-gray-600 rounded-xl p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-300 font-medium">Overall Progress</span>
                              <span className="text-white font-semibold">{progressStats.completionPercentage}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${progressStats.completionPercentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                              <span>{progressStats.attempted_questions} attempted</span>
                              <span>{progressStats.timeSpentFormatted} spent</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* All PYQs Card */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-6 cursor-pointer group"
                          onClick={() => setActiveMenu('all-pyqs')}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <FiList className="w-8 h-8 text-purple-400" />
                            <div className="bg-white/10 px-3 py-1 rounded-full">
                              <span className="text-white text-sm font-semibold">{questions.length} Qs</span>
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2 font-poppins">All PYQs</h3>
                          <p className="text-gray-300 text-sm mb-4">
                            Practice all previous year questions in sequence
                          </p>
                          <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                            <span className="font-semibold">Start Practicing</span>
                            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </motion.div>

                        {/* Topic-wise PYQs Card */}
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-2xl p-6 cursor-pointer group"
                          onClick={() => setActiveMenu('topic-wise')}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <FiFolder className="w-8 h-8 text-green-400" />
                            <div className="bg-white/10 px-3 py-1 rounded-full">
                              <span className="text-white text-sm font-semibold">{topics.length} Topics</span>
                            </div>
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2 font-poppins">Topic-wise PYQs</h3>
                          <p className="text-gray-300 text-sm mb-4">
                            Practice questions organized by specific topics
                          </p>
                          <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors">
                            <span className="font-semibold">Browse Topics</span>
                            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {activeMenu === 'all-pyqs' && (
                    <motion.div
                      key="all-pyqs"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white font-poppins">All PYQs</h2>
                        <div className="text-gray-400 text-sm">
                          {questions.length} questions • Sorted by date
                        </div>
                      </div>

                      <div className="space-y-4">
                        {questions.map((question, index) => (
                          <motion.div
                            key={question.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                            className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 hover:border-purple-500/50 cursor-pointer group transition-all duration-200"
                            onClick={() => router.push(`/pyq/exams/${exam}/${subject}/${chapter}/practice?type=all&question=${index + 1}`)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                {/* Question Header */}
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="flex items-center space-x-2 bg-purple-600/20 px-3 py-1 rounded-full">
                                    <FiCalendar className="w-3 h-3 text-purple-400" />
                                    <span className="text-purple-300 text-sm font-medium">
                                      {formatExamDate(question.year, question.month)}
                                      {question.shift && ` • ${question.shift}`}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-blue-600/20 px-3 py-1 rounded-full">
                                    <span className="text-blue-300 text-sm font-medium capitalize">
                                      {question.difficulty_category}
                                    </span>
                                  </div>
                                </div>

                                {/* Question Preview */}
                                <div className="mb-3">
                                  <p className="text-gray-200 text-sm leading-relaxed">
                                    {renderQuestionBlocks(question.question_blocks, 150)}
                                  </p>
                                </div>

                                {/* Question Type & Number */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                                    <span className="capitalize">{question.question_type}</span>
                                    <span>•</span>
                                    <span>Q{index + 1}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-purple-400 group-hover:text-purple-300 transition-colors">
                                    <span className="text-sm font-semibold">Solve</span>
                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {questions.length === 0 && (
                        <div className="text-center py-12">
                          <FiList className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-300 mb-2">No PYQs Available</h3>
                          <p className="text-gray-400 text-sm">No previous year questions found for this chapter</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeMenu === 'topic-wise' && (
                    <motion.div
                      key="topic-wise"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-white font-poppins">Topic-wise PYQs</h2>
                        <div className="text-gray-400 text-sm">
                          {topics.length} topics • {questions.length} questions
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topics.map((topic, index) => {
                          const questionCount = topicQuestionCounts[topic.id] || 0;
                          
                          return (
                            <motion.div
                              key={topic.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              whileHover={{ scale: 1.02 }}
                              className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 hover:border-green-500/50 cursor-pointer group"
                              onClick={() => router.push(`/pyq/exams/${exam}/${subject}/${chapter}/practice?type=topic&topic=${topic.slug}`)}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white group-hover:text-green-300 transition-colors">
                                  {topic.name}
                                </h3>
                                <div className="bg-green-500/20 px-3 py-1 rounded-full">
                                  <span className="text-green-300 text-sm font-semibold">
                                    {questionCount} Q{questionCount !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-400 text-sm mb-4">
                                Practice {questionCount} question{questionCount !== 1 ? 's' : ''} from {topic.name}
                              </p>
                              <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors">
                                <span className="font-semibold text-sm">
                                  {questionCount > 0 ? 'Practice Topic' : 'No Questions'}
                                </span>
                                {questionCount > 0 && (
                                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {topics.length === 0 && (
                        <div className="text-center py-12">
                          <FiFolder className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Topics Available</h3>
                          <p className="text-gray-400 text-sm">No topics found for this chapter</p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeMenu === 'bookmarked' && (
                    <motion.div
                      key="bookmarked"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-bold text-white mb-6 font-poppins">Bookmarked Questions</h2>
                      <div className="text-center py-12">
                        <FiBookmark className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Bookmarked Questions</h3>
                        <p className="text-gray-400 text-sm">Questions you bookmark will appear here</p>
                      </div>
                    </motion.div>
                  )}

                  {activeMenu === 'mistakes' && (
                    <motion.div
                      key="mistakes"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-bold text-white mb-6 font-poppins">My Mistakes</h2>
                      <div className="text-center py-12">
                        <FiAlertTriangle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Mistakes Yet</h3>
                        <p className="text-gray-400 text-sm">Questions you answer incorrectly will appear here for review</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}