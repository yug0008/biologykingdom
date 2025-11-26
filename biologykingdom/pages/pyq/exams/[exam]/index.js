// pages/pyq/exams/[exam]/index.js
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../hooks/useAuth';
import { FiFilter, FiX, FiChevronRight, FiBook, FiBarChart2, FiClock } from 'react-icons/fi';

const difficultyCategories = [
  'All Categories',
  'High Output High Input',
  'High Output Low Input',
  'Low Output Low Input',
  'Low Output High Input'
];

const yearRange = Array.from({ length: 18 }, (_, i) => 2025 - i); // 2008-2025

export default function ExamPYQPage() {
  const router = useRouter();
  const { exam } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [examData, setExamData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Categories');
  const [selectedYears, setSelectedYears] = useState([]);
  const [filteredChapters, setFilteredChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch exam data and subjects
  useEffect(() => {
    if (!exam || !user) return;

    const fetchExamData = async () => {
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

        // Fetch subjects for this exam
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .eq('exam_id', examData.id)
          .order('order');

        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData);

        if (subjectsData.length > 0) {
          setSelectedSubject(subjectsData[0]);
        }

      } catch (err) {
        console.error('Error fetching exam data:', err);
        setError('Failed to load exam data');
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [exam, user]);

  // Fetch chapters for selected subject
  useEffect(() => {
    if (!selectedSubject || !user) return;

    const fetchChapters = async () => {
      try {
        // Fetch chapters
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('subject_id', selectedSubject.id)
          .order('order');

        if (chaptersError) throw chaptersError;

        // Fetch question counts and recent stats for each chapter
        const chaptersWithStats = await Promise.all(
          chaptersData.map(async (chapter) => {
            // Total questions count
            const { count: totalQuestions, error: countError } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('chapter_id', chapter.id)
              .eq('category', 'PYQ');

            if (countError) console.error('Error counting questions:', countError);

            // Recent years stats (last 2 years)
            const currentYear = new Date().getFullYear();
            const recentStats = [];
            
            for (let year = currentYear; year >= currentYear - 1; year--) {
              const { count: yearCount, error: yearError } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('chapter_id', chapter.id)
                .eq('category', 'PYQ')
                .eq('year', year);

              if (!yearError && yearCount > 0) {
                recentStats.push({ year, count: yearCount });
              }
            }

            // Difficulty stats
            const difficultyStats = {};
            for (const difficulty of difficultyCategories.slice(1)) {
              const { count: diffCount, error: diffError } = await supabase
                .from('questions')
                .select('*', { count: 'exact', head: true })
                .eq('chapter_id', chapter.id)
                .eq('category', 'PYQ')
                .eq('difficulty_category', difficulty);

              if (!diffError) {
                difficultyStats[difficulty] = diffCount || 0;
              }
            }

            return {
              ...chapter,
              totalQuestions: totalQuestions || 0,
              recentStats,
              difficultyStats
            };
          })
        );

        setChapters(prev => ({
          ...prev,
          [selectedSubject.slug]: chaptersWithStats
        }));

      } catch (err) {
        console.error('Error fetching chapters:', err);
        setError('Failed to load chapters');
      }
    };

    fetchChapters();
  }, [selectedSubject, user]);

  // Memoized filtered and sorted chapters
  const sortedChapters = useMemo(() => {
    if (!filteredChapters.length) return [];

    return [...filteredChapters].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'questions':
          return b.totalQuestions - a.totalQuestions;
        case 'recent':
          const aRecent = a.recentStats.reduce((sum, stat) => sum + stat.count, 0);
          const bRecent = b.recentStats.reduce((sum, stat) => sum + stat.count, 0);
          return bRecent - aRecent;
        default:
          return a.order - b.order;
      }
    });
  }, [filteredChapters, sortBy]);

  // Filter chapters based on selected filters
  useEffect(() => {
    if (selectedSubject && chapters[selectedSubject.slug]) {
      let filtered = chapters[selectedSubject.slug];

      // Apply difficulty filter
      if (selectedDifficulty !== 'All Categories') {
        filtered = filtered.filter(chapter => 
          chapter.difficultyStats[selectedDifficulty] > 0
        );
      }

      // Apply year filter
      if (selectedYears.length > 0) {
        filtered = filtered.filter(chapter => 
          chapter.recentStats.some(stat => selectedYears.includes(stat.year))
        );
      }

      setFilteredChapters(filtered);
    }
  }, [selectedSubject, selectedDifficulty, selectedYears, chapters]);

  const toggleYear = (year) => {
    setSelectedYears(prev =>
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const selectAllYears = () => {
    setSelectedYears(yearRange);
  };

  const clearAllYears = () => {
    setSelectedYears([]);
  };

  const applySortAndClose = () => {
    setShowSortPanel(false);
  };

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

  if (!examData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Exam Not Found</h1>
          <p className="text-gray-300">The requested exam could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{examData.name} PYQs | Study Platform</title>
        <meta name="description" content={`Previous Year Questions for ${examData.name}`} />
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
        .chapter-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .chapter-scroll::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 3px;
        }
        .chapter-scroll::-webkit-scrollbar-thumb {
          background: #4B5563;
          border-radius: 3px;
        }
        .chapter-scroll::-webkit-scrollbar-thumb:hover {
          background: #6B7280;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900 to-gray-900"></div>
        
        {/* Header */}
        <div className="relative z-10 bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  onClick={() => router.push('/')}
                  className="flex-shrink-0 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  {examData.logo_url ? (
                    <img 
                      src={examData.logo_url} 
                      alt={examData.name}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {examData.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate font-poppins">
                    {examData.name} PYQs
                  </h1>
                  <p className="text-gray-400 text-xs sm:text-sm truncate">
                    {examData.year_range}
                  </p>
                </div>
              </div>
              
              {/* Sort Button */}
              <button
                onClick={() => setShowSortPanel(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <FiFilter className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium hidden sm:block">Sort & Filter</span>
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Subjects Sidebar */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 sticky top-24">
                <h2 className="text-lg font-semibold text-white mb-4 font-poppins">Subjects</h2>
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 group ${
                        selectedSubject?.id === subject.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                          : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent hover:border-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`font-medium text-sm ${
                          selectedSubject?.id === subject.id ? 'text-white' : 'text-gray-200 group-hover:text-white'
                        }`}>
                          {subject.name}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          selectedSubject?.id === subject.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-600 text-gray-300 group-hover:bg-gray-500'
                        }`}>
                          {chapters[subject.slug]?.reduce((total, chapter) => total + chapter.totalQuestions, 0) || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content - Chapters */}
            <div className="flex-1 min-w-0">
              {selectedSubject && (
                <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white font-poppins">
                        {selectedSubject.name} Chapters
                      </h2>
                      <p className="text-gray-400 text-sm mt-1">
                        {sortedChapters.length} chapters • {sortedChapters.reduce((total, chapter) => total + chapter.totalQuestions, 0)} questions
                      </p>
                    </div>
                    
                    {/* Active Filters Badge */}
                    <div className="flex items-center space-x-2">
                      {(selectedDifficulty !== 'All Categories' || selectedYears.length > 0) && (
                        <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg px-3 py-1">
                          <span className="text-purple-300 text-sm">
                            {selectedDifficulty !== 'All Categories' ? '1 filter' : ''}
                            {selectedYears.length > 0 ? ` ${selectedYears.length} years` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chapters Grid - Horizontal Scroll */}
                  <div className="chapter-scroll overflow-x-auto pb-4">
                    <div className="flex space-x-4 min-w-max">
                      {sortedChapters.map((chapter, index) => (
                        <motion.div
                          key={chapter.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ 
                            scale: 1.02,
                            transition: { duration: 0.2 }
                          }}
                          className="group cursor-pointer flex-shrink-0"
                          onClick={() => router.push(`/pyq/exams/${exam}/${selectedSubject.slug}/${chapter.slug}`)}
                        >
                          <div className="w-80 bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600 rounded-2xl p-5 hover:border-purple-500/50 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
                            {/* Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="relative z-10">
                              {/* Chapter Header */}
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-white group-hover:text-purple-200 transition-colors line-clamp-2 flex-1 mr-3">
                                  {chapter.name}
                                </h3>
                                <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                                  {chapter.totalQuestions} Qs
                                </span>
                              </div>

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                {/* Recent Questions */}
                                <div className="flex items-center space-x-2">
                                  <FiClock className="w-4 h-4 text-blue-400" />
                                  <div>
                                    <div className="text-xs text-gray-400">Recent</div>
                                    <div className="text-sm font-semibold text-white">
                                      {chapter.recentStats.reduce((sum, stat) => sum + stat.count, 0)} Qs
                                    </div>
                                  </div>
                                </div>

                                {/* Difficulty */}
                                <div className="flex items-center space-x-2">
                                  <FiBarChart2 className="w-4 h-4 text-purple-400" />
                                  <div>
                                    <div className="text-xs text-gray-400">Mixed</div>
                                    <div className="text-sm font-semibold text-white">Levels</div>
                                  </div>
                                </div>
                              </div>

                              {/* Recent Years */}
                              {chapter.recentStats.length > 0 && (
                                <div className="mb-4">
                                  <div className="text-xs text-gray-400 mb-2">Latest Pattern:</div>
                                  <div className="flex space-x-2">
                                    {chapter.recentStats.map((stat, idx) => (
                                      <div key={idx} className="flex items-center space-x-1 bg-gray-700/50 px-2 py-1 rounded">
                                        <span className="text-xs text-white font-medium">{stat.year}</span>
                                        <span className="text-xs text-green-400">({stat.count})</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Progress Bar */}
                              <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                  <span>Completion</span>
                                  <span>0%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
                                </div>
                              </div>

                              {/* Action Button */}
                              <div className="flex items-center justify-between">
                                <span className="text-purple-400 text-sm font-semibold group-hover:text-purple-300 flex items-center transition-colors">
                                  Start Now
                                  <FiChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="flex items-center space-x-1 text-xs text-gray-400">
                                  <FiBook className="w-3 h-3" />
                                  <span>PYQ</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {sortedChapters.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-lg font-medium mb-2">No chapters found</div>
                      <div className="text-gray-500 text-sm">
                        {chapters[selectedSubject.slug]?.length === 0 
                          ? 'No chapters available for this subject'
                          : 'Try adjusting your filters or select a different subject'
                        }
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sort Panel Overlay */}
        <AnimatePresence>
          {showSortPanel && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSortPanel(false)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />
              
              {/* Sort Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 bottom-0 w-full max-w-md bg-gray-900 border-r border-gray-700 z-50 overflow-y-auto"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white font-poppins">Sort & Filter</h2>
                    <button
                      onClick={() => setShowSortPanel(false)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <FiX className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>

                  {/* Sort By */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 font-poppins">Sort By</h3>
                    <div className="space-y-2">
                      {[
                        { value: 'name', label: 'Chapter Name', icon: '📝' },
                        { value: 'questions', label: 'Total Questions', icon: '❓' },
                        { value: 'recent', label: 'Recent Questions', icon: '🕒' },
                        { value: 'default', label: 'Default Order', icon: '🔢' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                            sortBy === option.value
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-lg">{option.icon}</span>
                            <span className={`font-medium ${
                              sortBy === option.value ? 'text-white' : 'text-gray-200'
                            }`}>
                              {option.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Filter */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4 font-poppins">Difficulty Category</h3>
                    <div className="space-y-2">
                      {difficultyCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedDifficulty(category)}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                            selectedDifficulty === category
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                              : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          <span className={`font-medium ${
                            selectedDifficulty === category ? 'text-white' : 'text-gray-200'
                          }`}>
                            {category}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Year Filter */}
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-white font-poppins">Select Years</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={selectAllYears}
                          className="text-sm text-purple-400 hover:text-purple-300 font-medium px-3 py-1 bg-purple-600/20 rounded-lg transition-colors"
                        >
                          All
                        </button>
                        <button
                          onClick={clearAllYears}
                          className="text-sm text-gray-400 hover:text-gray-300 font-medium px-3 py-1 bg-gray-700 rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2 year-filter border border-gray-700 rounded-xl p-4 bg-gray-800">
                      {yearRange.map((year) => (
                        <label key={year} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedYears.includes(year)}
                            onChange={() => toggleYear(year)}
                            className="rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-900"
                          />
                          <span className="text-gray-200 text-sm flex-1">{year}</span>
                          {selectedYears.includes(year) && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={applySortAndClose}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 font-poppins"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}