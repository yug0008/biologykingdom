import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../../../../hooks/useAuth';
import { useChapterData, useMenuData } from '../../../../../../hooks/useChapterData';
import { 
  ChapterOverviewSkeleton, 
  AllPYQsSkeleton, 
  TopicWiseSkeleton
} from '../../../../../../components/Skeletons';
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

// Render question blocks
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

// Server-side data fetching functions
const fetchExamData = async (examSlug) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('slug', examSlug)
    .single();
  
  if (error) throw error;
  return data;
};

const fetchSubjectData = async (subjectSlug, examId) => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('slug', subjectSlug)
    .eq('exam_id', examId)
    .single();
  
  if (error) throw error;
  return data;
};

const fetchChapterData = async (chapterSlug, subjectId) => {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('slug', chapterSlug)
    .eq('subject_id', subjectId)
    .single();
  
  if (error) throw error;
  return data;
};

const fetchTopics = async (chapterId) => {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('order');
  
  if (error) throw error;
  return data || [];
};

const fetchQuestions = async (chapterId) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('chapter_id', chapterId)
    .eq('category', 'PYQ')
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export async function getServerSideProps(context) {
  const { exam, subject, chapter } = context.params;
  const { createQueryClient } = await import('../../../../../../lib/react-query');
  const { dehydrate } = await import('@tanstack/react-query');
  const { supabase } = await import('../../../../../../lib/supabase');
  
  // Create a new QueryClient for each request
  const queryClient = createQueryClient();

  try {
    // Prefetch all data on server
    await Promise.all([
      queryClient.prefetchQuery(['exam', exam], () => fetchExamData(exam)),
      queryClient.prefetchQuery(['subject', exam, subject], async () => {
        const examData = await fetchExamData(exam);
        return fetchSubjectData(subject, examData.id);
      }),
      queryClient.prefetchQuery(['chapter', exam, subject, chapter], async () => {
        const examData = await fetchExamData(exam);
        const subjectData = await fetchSubjectData(subject, examData.id);
        return fetchChapterData(chapter, subjectData.id);
      }),
      queryClient.prefetchQuery(['topics', exam, subject, chapter], async () => {
        const examData = await fetchExamData(exam);
        const subjectData = await fetchSubjectData(subject, examData.id);
        const chapterData = await fetchChapterData(chapter, subjectData.id);
        return fetchTopics(chapterData.id);
      }),
      queryClient.prefetchQuery(['questions', exam, subject, chapter], async () => {
        const examData = await fetchExamData(exam);
        const subjectData = await fetchSubjectData(subject, examData.id);
        const chapterData = await fetchChapterData(chapter, subjectData.id);
        return fetchQuestions(chapterData.id);
      })
    ]);

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    // Return empty dehydrated state on error
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
    };
  }
}

// Component for Overview Content
const OverviewContent = ({ progressStats, questions, topics, onMenuChange }) => (
  <>
   {/* Quick Actions */}
    <div className="grid mb-8 grid-cols-1 md:grid-cols-2 gap-6">
      {/* All PYQs Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-6 cursor-pointer group"
        onClick={() => onMenuChange('all-pyqs')}
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
        onClick={() => onMenuChange('topic-wise')}
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
    {/* Progress Overview */}
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 font-poppins">Your Progress</h2>
      
      {progressStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Attempted Questions */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Attempted</span>
              <FiCheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{progressStats.attempted_questions}</div>
            <div className="text-xs text-gray-400">out of {questions.length}</div>
          </div>

          {/* Correct Answers */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Correct</span>
              <FiCheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{progressStats.correct_questions}</div>
            <div className="text-xs text-gray-400">answers</div>
          </div>

          {/* Incorrect Answers */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Incorrect</span>
              <FiXCircle className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">{progressStats.incorrect_questions}</div>
            <div className="text-xs text-gray-400">answers</div>
          </div>

          {/* Accuracy */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Accuracy</span>
              <FiBarChart2 className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{progressStats.accuracy}%</div>
            <div className="text-xs text-gray-400">success rate</div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6 text-center">
          <FiBarChart2 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Progress Yet</h3>
          <p className="text-gray-400 text-sm">Start practicing to track your progress</p>
        </div>
      )}

      {/* Progress Bar */}
      {progressStats && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300 font-medium">Overall Progress</span>
            <span className="text-white font-semibold">{progressStats.completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-3">
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

   
  </>
);

// Component for All PYQs Content
const AllPYQsContent = ({ questions, exam, subject, chapter, router }) => (
  <>
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
          className="bg-slate-700/50 border border-slate-600 rounded-xl p-5 hover:border-purple-500/50 cursor-pointer group transition-all duration-200"
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
  </>
);

// Component for Topic-wise Content
const TopicWiseContent = ({ topics, questions, topicQuestionCounts, exam, subject, chapter, router }) => (
  <>
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
            className="bg-slate-700/50 border border-slate-600 rounded-xl p-5 hover:border-green-500/50 cursor-pointer group"
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
  </>
);

// Components for other menu items
const BookmarkedContent = () => (
  <>
    <h2 className="text-2xl font-bold text-white mb-6 font-poppins">Bookmarked Questions</h2>
    <div className="text-center py-12">
      <FiBookmark className="w-16 h-16 text-gray-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-300 mb-2">No Bookmarked Questions</h3>
      <p className="text-gray-400 text-sm">Questions you bookmark will appear here</p>
    </div>
  </>
);

const MistakesContent = () => (
  <>
    <h2 className="text-2xl font-bold text-white mb-6 font-poppins">My Mistakes</h2>
    <div className="text-center py-12">
      <FiAlertTriangle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-300 mb-2">No Mistakes Yet</h3>
      <p className="text-gray-400 text-sm">Questions you answer incorrectly will appear here for review</p>
    </div>
  </>
);

// Main Page Component
export default function ChapterDetailPage({ dehydratedState }) {
  const router = useRouter();
  const { exam, subject, chapter } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [activeMenu, setActiveMenu] = useState('overview');

  // Use React Query for data fetching
  const [
    examQuery, 
    subjectQuery, 
    chapterQuery, 
    topicsQuery, 
    questionsQuery, 
    userProgressQuery
  ] = useChapterData(exam, subject, chapter, user?.id);

  // Use separate query for menu data to ensure clean transitions
  const menuDataQuery = useMenuData(activeMenu, exam, subject, chapter, user?.id);

  // Extract data
  const examData = examQuery.data;
  const subjectData = subjectQuery.data;
  const chapterData = chapterQuery.data;
  const topics = topicsQuery.data || [];
  const questions = questionsQuery.data || [];
  const userProgress = userProgressQuery.data;

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
      .slice(0, 2);
  }, [questions]);

  // Check if any initial data is loading
  const isLoading = authLoading || 
    examQuery.isLoading || 
    subjectQuery.isLoading || 
    chapterQuery.isLoading;

  // Check if menu data is loading
  const isMenuLoading = menuDataQuery.isLoading;

  // Handle menu change
  const handleMenuChange = (menuId) => {
    setActiveMenu(menuId);
  };

  // Show loading state for initial page load
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  // Show error state
  if (examQuery.error || subjectQuery.error || chapterQuery.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-300">Failed to load chapter data</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
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

      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
        
        {/* Header */}
<div className="relative z-10 bg-slate-900 backdrop-blur-lg border-b border-slate-700">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
    <div className="flex items-center justify-between">

      {/* Left section */}
      <div className="flex items-center space-x-3 min-w-0">

        {/* Back button */}
        <button
          onClick={() => router.push(`/pyq/exams/${exam}`)}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex-shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Breadcrumb + Title */}
        <div className="min-w-0 flex-1">
          <nav className="flex items-center space-x-1 text-[10px] sm:text-xs text-gray-400 mb-0.5">
            <span>{examData?.name}</span>
            <span>•</span>
            <span>{subjectData?.name}</span>
          </nav>

          {/* Chapter name - responsive smallest text */}
          <h1 className="font-bold text-white truncate font-poppins 
                         text-sm sm:text-lg md:text-xl">
            {chapterData.name}
          </h1>
        </div>
      </div>

      {/* Right Section (Stats + Q Count) */}
      <div className="flex flex-col items-end space-y-1">

        {/* Year Stats row */}
        <div className="text-gray-300 text-[10px] sm:text-xs flex gap-1 overflow-x-auto no-scrollbar max-w-[160px] sm:max-w-none whitespace-nowrap">
          {recentYearStats.map((stat, index) => (
            <span key={index} className="flex items-center flex-shrink-0">
              <span className="text-white font-semibold">{stat.year}:</span>
              <span className="text-green-400 font-semibold ml-1">{stat.count} Qs</span>
              {index !== recentYearStats.length - 1 && (
                <span className="mx-1 text-gray-500">|</span>
              )}
            </span>
          
          ))}
        </div>

        {/* Questions Count */}
        <div className="flex items-center space-x-1 bg-slate-700/50 px-2 py-1 rounded-lg">
          <FiBook className="w-3 h-3 text-purple-400" />
          <span className="text-white text-[11px] sm:text-sm font-medium">
            {questions.length} Questions
          </span>
        </div>

      </div>

    </div>
  </div>
</div>


        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-4 sticky top-24">
                {/* Navigation Menu */}
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuChange(item.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 text-left ${
                        activeMenu === item.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                          : 'bg-slate-700/50 hover:bg-slate-700 border border-transparent hover:border-slate-600'
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
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 min-h-[600px]">
                <AnimatePresence mode="wait">
                  {activeMenu === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isMenuLoading ? (
                        <ChapterOverviewSkeleton />
                      ) : (
                        <OverviewContent 
                          progressStats={progressStats}
                          questions={questions}
                          topics={topics}
                          onMenuChange={setActiveMenu}
                        />
                      )}
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
                      {isMenuLoading ? (
                        <AllPYQsSkeleton />
                      ) : (
                        <AllPYQsContent 
                          questions={menuDataQuery.data?.questions || questions}
                          exam={exam}
                          subject={subject}
                          chapter={chapter}
                          router={router}
                        />
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
                      {isMenuLoading ? (
                        <TopicWiseSkeleton />
                      ) : (
                        <TopicWiseContent 
                          topics={menuDataQuery.data?.topics || topics}
                          questions={menuDataQuery.data?.questions || questions}
                          topicQuestionCounts={topicQuestionCounts}
                          exam={exam}
                          subject={subject}
                          chapter={chapter}
                          router={router}
                        />
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
                      <BookmarkedContent />
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
                      <MistakesContent />
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