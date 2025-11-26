// pages/pyq/exams/[exam]/[subject]/[chapter]/practice/index.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../../../../lib/supabase';
import { useAuth } from '../../../../../../../hooks/useAuth';
import { 
  FiArrowLeft, 
  FiBookmark, 
  FiBook, 
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiFlag,
  FiChevronLeft,
  FiChevronRight,
  FiPlay
} from 'react-icons/fi';

// Format exam date
const formatExamDate = (year, month, shift) => {
  if (!year) return 'Unknown Date';
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = month ? monthNames[month - 1] : '';
  
  let date = monthName ? `${monthName} ${year}` : `${year}`;
  if (shift) {
    date += ` • ${shift}`;
  }
  
  return date;
};

// Format time for timer
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Safe JSON parsing function
const parseJSONB = (content) => {
  if (!content) return null;
  
  try {
    // If it's already an object/array, return as is
    if (typeof content === 'object') {
      return content;
    }
    
    // If it's a string, try to parse it
    if (typeof content === 'string') {
      // Check if it looks like JSON (starts with {, [, or valid JSON structure)
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return JSON.parse(content);
      } else {
        // If it's a simple string, wrap it in a text block
        return [{ type: 'text', content: content }];
      }
    }
    
    return null;
  } catch (error) {
    console.warn('JSON parsing failed, treating as text:', error);
    // If parsing fails, treat the content as plain text
    return [{ type: 'text', content: String(content) }];
  }
};

// Render content blocks
const RenderContent = ({ blocks, className = '' }) => {
  const parsedBlocks = parseJSONB(blocks);
  
  if (!parsedBlocks || !Array.isArray(parsedBlocks)) {
    return (
      <div className={`text-gray-400 ${className}`}>
        No content available
      </div>
    );
  }

  return (
    <div className={className}>
      {parsedBlocks.map((block, index) => {
        if (!block || typeof block !== 'object') {
          return (
            <span key={index} className="text-gray-200 leading-relaxed">
              {String(block)}
            </span>
          );
        }

        if (block.type === 'text') {
          return (
            <span key={index} className="text-gray-200 leading-relaxed">
              {block.content}
            </span>
          );
        } else if (block.type === 'latex') {
          return (
            <div key={index} className="inline-block bg-gray-700 px-2 py-1 rounded mx-1 my-1">
              <span className="text-purple-300 text-sm font-mono">[{block.content}]</span>
            </div>
          );
        } else if (block.type === 'image') {
          return (
            <div key={index} className="my-3 flex justify-center">
              <img 
                src={block.url} 
                alt="Question visual"
                className="max-w-full h-auto rounded-lg border border-gray-600 max-h-64 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          );
        } else {
          // Fallback for unknown block types
          return (
            <span key={index} className="text-gray-200 leading-relaxed">
              {block.content || JSON.stringify(block)}
            </span>
          );
        }
      })}
    </div>
  );
};

// Render options for objective questions
const RenderOptions = ({ options, selectedOption, onOptionSelect, showSolution, correctAnswer }) => {
  const parsedOptions = parseJSONB(options);
  
  if (!parsedOptions || !Array.isArray(parsedOptions)) {
    return (
      <div className="text-gray-400 text-center py-4">
        No options available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {parsedOptions.map((option, index) => {
        const optionId = option.id || `option-${index}`;
        
        return (
          <motion.button
            key={optionId}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => !showSolution && onOptionSelect(optionId)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedOption === optionId
                ? showSolution
                  ? optionId === correctAnswer?.id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                  : 'border-purple-500 bg-purple-500/10'
                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
            } ${showSolution ? 'cursor-default' : 'cursor-pointer'}`}
            disabled={showSolution}
          >
            <div className="flex items-center space-x-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${
                selectedOption === optionId
                  ? showSolution
                    ? optionId === correctAnswer?.id
                      ? 'border-green-500 text-green-500 bg-green-500/20'
                      : 'border-red-500 text-red-500 bg-red-500/20'
                    : 'border-purple-500 text-purple-500 bg-purple-500/20'
                  : 'border-gray-500 text-gray-400'
              }`}>
                {optionId}
              </div>
              <div className="flex-1 min-w-0">
                <RenderContent 
                  blocks={option.blocks || option.content || option} 
                  className="text-gray-200"
                />
              </div>
              {showSolution && optionId === correctAnswer?.id && (
                <FiCheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default function PracticePage() {
  const router = useRouter();
  const { exam, subject, chapter } = router.query;
  const { type, question: questionParam, topic } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [examData, setExamData] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [timer, setTimer] = useState(0);
  const [userAttempts, setUserAttempts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const solutionRef = useRef(null);
  const timerRef = useRef(null);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAttempt = userAttempts[currentQuestion?.id];
  const correctAnswer = currentQuestion ? parseJSONB(currentQuestion.correct_answer) : null;

  // Debug current question
  useEffect(() => {
    if (currentQuestion) {
      console.log('=== CURRENT QUESTION DEBUG ===');
      console.log('Question ID:', currentQuestion.id);
      console.log('Question Type:', currentQuestion.question_type);
      console.log('Raw Question Blocks:', currentQuestion.question_blocks);
      console.log('Parsed Question Blocks:', parseJSONB(currentQuestion.question_blocks));
      console.log('Raw Options:', currentQuestion.options);
      console.log('Parsed Options:', parseJSONB(currentQuestion.options));
      console.log('Raw Correct Answer:', currentQuestion.correct_answer);
      console.log('Parsed Correct Answer:', correctAnswer);
      console.log('=============================');
    }
  }, [currentQuestion]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Start timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  // Fetch all data
  useEffect(() => {
    if (!exam || !subject || !chapter || !user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('Fetching data for:', { exam, subject, chapter, type, topic });

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

        // Build query for questions
        let query = supabase
          .from('questions')
          .select('*')
          .eq('chapter_id', chapterData.id)
          .eq('category', 'PYQ');

        // Filter by topic if in topic mode
        if (type === 'topic' && topic) {
          const { data: topicData, error: topicError } = await supabase
            .from('topics')
            .select('id')
            .eq('slug', topic)
            .eq('chapter_id', chapterData.id)
            .single();

          if (!topicError && topicData) {
            query = query.eq('topic_id', topicData.id);
          }
        }

        // Execute query
        const { data: questionsData, error: questionsError } = await query
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (questionsError) throw questionsError;
        
        console.log('Questions fetched:', questionsData?.length);
        setQuestions(questionsData || []);

        // Fetch user attempts for these questions
        if (questionsData && questionsData.length > 0) {
          await fetchUserAttempts(questionsData.map(q => q.id));
        }

        // Set initial question index
        if (questionParam && questionsData && questionsData.length > 0) {
          const questionIndex = Math.min(parseInt(questionParam) - 1, questionsData.length - 1);
          setCurrentQuestionIndex(Math.max(0, questionIndex));
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load practice data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [exam, subject, chapter, user, type, topic, questionParam]);

  // Fetch user attempts
  const fetchUserAttempts = async (questionIds) => {
    try {
      const { data: attempts, error } = await supabase
        .from('user_question_attempts')
        .select('*')
        .in('question_id', questionIds)
        .eq('user_id', user.id);

      if (error) throw error;

      const attemptsMap = {};
      attempts?.forEach(attempt => {
        attemptsMap[attempt.question_id] = attempt;
      });

      setUserAttempts(attemptsMap);
    } catch (err) {
      console.error('Error fetching attempts:', err);
    }
  };

  // Check bookmark status when question changes
  useEffect(() => {
    if (currentQuestion) {
      const attempt = userAttempts[currentQuestion.id];
      setIsBookmarked(attempt?.is_bookmarked || false);
      setSelectedOption(attempt?.user_answer || null);
      setShowSolution(false);
    }
  }, [currentQuestion, userAttempts]);

  // Save user attempt
  const saveAttempt = async (isCorrect, userAnswer = null) => {
    if (!currentQuestion || !user) return;

    try {
      setSubmitting(true);

      const attemptData = {
        user_id: user.id,
        question_id: currentQuestion.id,
        chapter_id: currentQuestion.chapter_id,
        user_answer: userAnswer || selectedOption,
        is_correct: isCorrect,
        time_taken: timer,
        question_difficulty: currentQuestion.difficulty_category,
        question_type: currentQuestion.question_type,
        is_bookmarked: isBookmarked,
        attempted_at: new Date().toISOString()
      };

      // Check if attempt already exists
      const existingAttempt = userAttempts[currentQuestion.id];

      let error;
      if (existingAttempt) {
        // Update existing attempt
        const { error: updateError } = await supabase
          .from('user_question_attempts')
          .update(attemptData)
          .eq('id', existingAttempt.id);
        error = updateError;
      } else {
        // Insert new attempt
        const { error: insertError } = await supabase
          .from('user_question_attempts')
          .insert([attemptData]);
        error = insertError;
      }

      if (error) throw error;

      // Refresh attempts
      await fetchUserAttempts(questions.map(q => q.id));

    } catch (err) {
      console.error('Error saving attempt:', err);
      alert('Error saving your attempt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle bookmark
  const toggleBookmark = async () => {
    if (!currentQuestion) return;

    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);

      const existingAttempt = userAttempts[currentQuestion.id];
      
      if (existingAttempt) {
        // Update existing attempt
        const { error } = await supabase
          .from('user_question_attempts')
          .update({ is_bookmarked: newBookmarkState })
          .eq('id', existingAttempt.id);

        if (error) throw error;
      } else {
        // Create new attempt with bookmark only
        const { error } = await supabase
          .from('user_question_attempts')
          .insert([{
            user_id: user.id,
            question_id: currentQuestion.id,
            chapter_id: currentQuestion.chapter_id,
            is_bookmarked: newBookmarkState,
            attempted_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      // Refresh attempts
      await fetchUserAttempts(questions.map(q => q.id));

    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setIsBookmarked(!isBookmarked);
      alert('Error updating bookmark. Please try again.');
    }
  };

  // Check answer
  const checkAnswer = () => {
    if (!currentQuestion || !selectedOption) {
      alert('Please select an answer first!');
      return;
    }

    console.log('Checking answer:', { 
      selectedOption, 
      correctAnswer,
      questionType: currentQuestion.question_type 
    });

    let isCorrect = false;
    
    if (currentQuestion.question_type === 'objective') {
      isCorrect = selectedOption === correctAnswer?.id;
      console.log('Objective check result:', isCorrect);
    } else {
      // Numerical question
      const userValue = parseFloat(selectedOption);
      const correctValue = parseFloat(correctAnswer?.value);
      isCorrect = !isNaN(userValue) && !isNaN(correctValue) && userValue === correctValue;
      console.log('Numerical check result:', isCorrect, { userValue, correctValue });
    }

    saveAttempt(isCorrect);
    setShowSolution(true);

    // Scroll to solution after a brief delay
    setTimeout(() => {
      solutionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowSolution(false);
    }
  };

  // Navigate to previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption(null);
      setShowSolution(false);
    }
  };

  // Report error
  const reportError = async () => {
    if (!currentQuestion) return;

    try {
      const { error } = await supabase
        .from('question_reports')
        .insert([{
          question_id: currentQuestion.id,
          user_id: user.id,
          report_type: 'error',
          description: 'User reported an error in this question',
          reported_at: new Date().toISOString()
        }]);

      if (error) throw error;

      alert('Error reported successfully! Our team will review it.');
    } catch (err) {
      console.error('Error reporting issue:', err);
      alert('Failed to report error. Please try again.');
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading questions...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
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

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">No Questions Found</h1>
          <p className="text-gray-300 mb-4">No questions available for practice in this chapter.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Practice | {chapterData?.name} | {subjectData?.name} | {examData?.name}</title>
        <meta name="description" content={`Practice ${chapterData?.name} questions for ${examData?.name}`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Compact Header */}
        <div className="bg-gray-800/80 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              {/* Breadcrumb and Back */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <button
                  onClick={() => router.back()}
                  className="flex-shrink-0 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4 text-white" />
                </button>
                
                <div className="min-w-0 flex-1">
                  <nav className="flex items-center space-x-1 text-xs text-gray-400 truncate">
                    <span className="truncate">{examData?.name}</span>
                    <span>›</span>
                    <span className="truncate">{subjectData?.name}</span>
                    <span>›</span>
                    <span className="text-white font-medium truncate">Practice</span>
                  </nav>
                </div>
              </div>

              {/* Timer and Question Info */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                <div className="flex items-center space-x-2 bg-purple-600/20 px-3 py-1.5 rounded-lg">
                  <FiClock className="w-3 h-3 text-purple-400" />
                  <span className="text-purple-300 text-sm font-mono">{formatTime(timer)}</span>
                </div>
                
                <div className="text-gray-300 text-sm">
                  Q{currentQuestionIndex + 1} of {questions.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl overflow-hidden">
            {/* Question Header */}
            <div className="border-b border-gray-700 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-blue-600/20 px-3 py-1 rounded-full">
                    <FiCalendar className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-300 text-sm font-medium">
                      {formatExamDate(currentQuestion.year, currentQuestion.month, currentQuestion.shift)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-green-600/20 px-3 py-1 rounded-full">
                    <span className="text-green-300 text-sm font-medium capitalize">
                      {currentQuestion.difficulty_category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={toggleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  <FiBookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-6">
              {/* Question */}
              <div className="mb-8">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="bg-purple-600 text-white text-sm font-semibold px-3 py-1 rounded-full flex-shrink-0">
                    Q{currentQuestionIndex + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <RenderContent 
                      blocks={currentQuestion.question_blocks} 
                      className="text-lg text-white leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Options for Objective Questions */}
              {currentQuestion.question_type === 'objective' && (
                <div className="mb-8">
                  <h3 className="text-gray-300 text-sm font-semibold mb-4">Select your answer:</h3>
                  <RenderOptions 
                    options={currentQuestion.options}
                    selectedOption={selectedOption}
                    onOptionSelect={setSelectedOption}
                    showSolution={showSolution}
                    correctAnswer={correctAnswer}
                  />
                </div>
              )}

              {/* Numerical Input */}
              {currentQuestion.question_type === 'numerical' && (
                <div className="mb-8">
                  <h3 className="text-gray-300 text-sm font-semibold mb-4">Enter your answer:</h3>
                  <input
                    type="number"
                    step="any"
                    value={selectedOption || ''}
                    onChange={(e) => !showSolution && setSelectedOption(e.target.value)}
                    disabled={showSolution}
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-lg focus:border-purple-500 focus:outline-none transition-colors disabled:opacity-50"
                    placeholder="Enter numerical value"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-between items-center pt-4 border-t border-gray-700">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-3">
                  {!showSolution ? (
                    <button
                      onClick={checkAnswer}
                      disabled={!selectedOption || submitting}
                      className="flex items-center space-x-2 px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      <span>{submitting ? 'Checking...' : 'Check Answer'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={nextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      <span>Next Question</span>
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Solution Section */}
            <AnimatePresence>
              {showSolution && (
                <motion.div
                  ref={solutionRef}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-700"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
                        <FiBook className="w-5 h-5 text-green-400" />
                        <span>Solution</span>
                      </h3>
                      
                      <button
                        onClick={reportError}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
                      >
                        <FiFlag className="w-4 h-4" />
                        <span>Report Error</span>
                      </button>
                    </div>

                    {/* Result Indicator */}
                    {currentAttempt && (
                      <div className={`p-4 rounded-xl mb-6 ${
                        currentAttempt.is_correct 
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : 'bg-red-500/20 border border-red-500/30'
                      }`}>
                        <div className="flex items-center space-x-3">
                          {currentAttempt.is_correct ? (
                            <FiCheckCircle className="w-6 h-6 text-green-400" />
                          ) : (
                            <FiXCircle className="w-6 h-6 text-red-400" />
                          )}
                          <div>
                            <p className={`font-semibold ${
                              currentAttempt.is_correct ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {currentAttempt.is_correct ? 'Correct!' : 'Incorrect'}
                            </p>
                            <p className="text-gray-300 text-sm mt-1">
                              {currentAttempt.is_correct 
                                ? 'Great job! You got it right.' 
                                : 'Better luck next time. Review the solution below.'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Solution Content */}
                    <div className="space-y-6">
                      {/* Solution Blocks */}
                      {currentQuestion.solution_blocks && (
                        <div className="bg-gray-700/30 rounded-xl p-4">
                          <h4 className="text-gray-300 text-sm font-semibold mb-3">Step-by-step solution:</h4>
                          <RenderContent 
                            blocks={currentQuestion.solution_blocks} 
                            className="text-gray-200 leading-relaxed space-y-2"
                          />
                        </div>
                      )}

                      {/* Solution Image */}
                      {currentQuestion.solution_image_url && (
                        <div className="bg-gray-700/30 rounded-xl p-4">
                          <h4 className="text-gray-300 text-sm font-semibold mb-3">Solution Diagram:</h4>
                          <img 
                            src={currentQuestion.solution_image_url} 
                            alt="Solution visual"
                            className="max-w-full h-auto rounded-lg border border-gray-600 mx-auto max-h-80 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Solution Video */}
                      {currentQuestion.solution_video_url && (
                        <div className="bg-gray-700/30 rounded-xl p-4">
                          <h4 className="text-gray-300 text-sm font-semibold mb-3">Video Solution:</h4>
                          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
                            <iframe
                              src={currentQuestion.solution_video_url.replace('watch?v=', 'embed/')}
                              className="w-full h-64"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      )}

                      {!currentQuestion.solution_blocks && !currentQuestion.solution_image_url && !currentQuestion.solution_video_url && (
                        <div className="text-center py-8 text-gray-400">
                          <FiAlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No solution available for this question.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}