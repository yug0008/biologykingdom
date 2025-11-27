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
  FiChevronRight
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

// Ultra-safe JSON parsing function
const safeParseJSON = (content) => {
  if (content === null || content === undefined) {
    return null;
  }
  
  if (typeof content === 'object' && content !== null) {
    return content;
  }
  
  if (typeof content !== 'string') {
    return content;
  }
  
  const trimmed = content.trim();
  
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.warn('JSON parsing failed, returning as string:', content.substring(0, 50));
      return content;
    }
  }
  
  return content;
};

// Parse question blocks
const parseQuestionBlocks = (content) => {
  const parsed = safeParseJSON(content);
  
  if (Array.isArray(parsed)) {
    return parsed;
  }
  
  if (typeof parsed === 'string') {
    return [{ type: 'text', content: parsed }];
  }
  
  return [{ type: 'text', content: 'Question content not available' }];
};

// Parse options
const parseOptions = (content) => {
  const parsed = safeParseJSON(content);
  
  // If it's already an array of objects with the correct structure, return it
  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].id !== undefined) {
    return parsed;
  }
  
  // If it's an array of strings, convert to the expected object format
  if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    return parsed.map((option, index) => ({
      id: optionLetters[index] || `option-${index + 1}`,
      blocks: [{ type: 'text', content: option }]
    }));
  }
  
  // If it's a string, try to parse it as JSON array
  if (typeof parsed === 'string') {
    try {
      const jsonParsed = JSON.parse(parsed);
      if (Array.isArray(jsonParsed)) {
        return parseOptions(jsonParsed);
      }
    } catch (error) {
      // If not JSON, treat as single string option
    }
  }
  
  // Create default options if nothing works
  const optionLetters = ['A', 'B', 'C', 'D'];
  return optionLetters.map(letter => ({
    id: letter,
    blocks: [{ type: 'text', content: `Option ${letter}` }]
  }));
};

// Parse correct answer
const parseCorrectAnswer = (content) => {
  const parsed = safeParseJSON(content);
  
  // If it's already an object with id, return it
  if (parsed && typeof parsed === 'object' && parsed.id) {
    return parsed;
  }
  
  // If it's a string, store for matching
  if (typeof parsed === 'string') {
    return { content: parsed };
  }
  
  // If it's a string that might be JSON, try to parse it
  if (typeof parsed === 'string') {
    try {
      const jsonParsed = JSON.parse(parsed);
      if (jsonParsed && typeof jsonParsed === 'object') {
        return jsonParsed;
      }
    } catch (error) {
      return { content: parsed };
    }
  }
  
  return { id: 'A' };
};

// Find correct option ID by matching content
const findCorrectOptionId = (options, correctAnswer) => {
  if (!correctAnswer) return null;
  
  // If correct answer already has an ID, use it
  if (correctAnswer.id) {
    return correctAnswer.id;
  }
  
  // If correct answer has content, find the option that matches
  if (correctAnswer.content) {
    const parsedOptions = parseOptions(options);
    const correctOption = parsedOptions.find(option => {
      const optionContent = option.blocks?.[0]?.content || option.content;
      return optionContent === correctAnswer.content;
    });
    
    if (correctOption) {
      return correctOption.id;
    }
  }
  
  return null;
};

// CORRECTED: Content renderer that properly handles LaTeX
const RenderContent = ({ blocks, className = '' }) => {
  const parsedBlocks = parseQuestionBlocks(blocks);
  
  const renderTextWithLaTeX = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    // Handle ALL possible LaTeX formats in one pass
    const parts = text.split(/(\\\\(?:\\(?:\(|\))|[^]|\\\(.*?\\\))|\\\(.*?\\\)|\$.*?\$|\$\$.*?\$\$)/g);
    
    const result = [];
    let currentPart = '';
    let inLaTeX = false;
    let latexType = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (!part) continue;
      
      // Check for LaTeX start patterns
      if (part === '\\(' || part === '\\\\(' || part === '$' || part === '$$') {
        if (currentPart) {
          result.push(
            <span key={result.length} className="text-gray-200">
              {currentPart}
            </span>
          );
          currentPart = '';
        }
        
        inLaTeX = true;
        latexType = part;
        currentPart = part;
      } 
      // Check for LaTeX end patterns
      else if ((part === '\\)' && latexType === '\\(') || 
               (part === '\\\\)' && latexType === '\\\\(') ||
               (part === '$' && latexType === '$') ||
               (part === '$$' && latexType === '$$')) {
        
        currentPart += part;
        
        // Extract LaTeX content based on the type
        let latexContent = '';
        if (latexType === '\\(') {
          latexContent = currentPart.slice(2, -2); // Remove \( and \)
        } else if (latexType === '\\\\(') {
          latexContent = currentPart.slice(3, -3); // Remove \\\( and \\\)
        } else if (latexType === '$') {
          latexContent = currentPart.slice(1, -1); // Remove $ and $
        } else if (latexType === '$$') {
          latexContent = currentPart.slice(2, -2); // Remove $$ and $$
        }
        
        result.push(
          <span
            key={result.length}
            className="font-mono bg-purple-900/40 px-2 py-1 rounded border border-purple-600 text-purple-200 mx-1"
          >
            {latexContent}
          </span>
        );
        
        currentPart = '';
        inLaTeX = false;
        latexType = '';
      }
      // If we're inside LaTeX, keep adding to current part
      else if (inLaTeX) {
        currentPart += part;
      }
      // Regular text
      else {
        currentPart += part;
      }
    }
    
    // Add any remaining text
    if (currentPart) {
      result.push(
        <span key={result.length} className="text-gray-200">
          {currentPart}
        </span>
      );
    }
    
    return result;
  };

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
            <div key={index} className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {renderTextWithLaTeX(block.content)}
            </div>
          );
        } else if (block.type === 'latex') {
          return (
            <span
              key={index}
              className="font-mono bg-purple-900/40 px-2 py-1 rounded border border-purple-600 text-purple-200 mx-1"
            >
              {block.content}
            </span>
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
  const parsedOptions = parseOptions(options);

  if (!parsedOptions || parsedOptions.length === 0) {
    return (
      <div className="text-gray-400 text-center py-4">
        No options available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {parsedOptions.map((option, index) => {
        const optionId = option.id || `option-${index + 1}`;
        const optionContent = option.blocks || option.content || `Option ${optionId}`;
        
        return (
          <motion.button
            key={optionId}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => !showSolution && onOptionSelect(optionId)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              selectedOption === optionId
                ? showSolution
                  ? optionId === correctAnswer
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                  : 'border-purple-500 bg-purple-500/10'
                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
            } ${showSolution ? 'cursor-default' : 'cursor-pointer'}`}
            disabled={showSolution}
          >
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${
                selectedOption === optionId
                  ? showSolution
                    ? optionId === correctAnswer
                      ? 'border-green-500 text-green-500 bg-green-500/20'
                      : 'border-red-500 text-red-500 bg-red-500/20'
                    : 'border-purple-500 text-purple-500 bg-purple-500/20'
                  : 'border-gray-500 text-gray-400 bg-gray-700/50'
              }`}>
                {optionId}
              </div>
              <div className="flex-1 min-w-0">
                <RenderContent 
                  blocks={optionContent}
                  className="text-gray-200 text-sm"
                />
              </div>
              {showSolution && optionId === correctAnswer && (
                <FiCheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
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
  
  // Get correct answer and find the correct option ID
  const rawCorrectAnswer = currentQuestion ? parseCorrectAnswer(currentQuestion.correct_answer) : null;
  const correctAnswerId = currentQuestion ? findCorrectOptionId(currentQuestion.options, rawCorrectAnswer) : null;

  // Debug current question
  useEffect(() => {
    if (currentQuestion) {
      console.log('=== CURRENT QUESTION DEBUG ===');
      console.log('Question ID:', currentQuestion.id);
      console.log('Question Type:', currentQuestion.question_type);
      console.log('Raw Options:', currentQuestion.options);
      console.log('Parsed Options:', parseOptions(currentQuestion.options));
      console.log('Raw Correct Answer:', currentQuestion.correct_answer);
      console.log('Parsed Correct Answer:', rawCorrectAnswer);
      console.log('Correct Answer ID:', correctAnswerId);
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

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

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

        // Build query for questions
        let query = supabase
          .from('questions')
          .select('*')
          .eq('chapter_id', chapterData.id)
          .eq('category', 'PYQ');

        // Filter by topic if in topic mode
        if (type === 'topic' && topic) {
          const { data: topicData } = await supabase
            .from('topics')
            .select('id')
            .eq('slug', topic)
            .eq('chapter_id', chapterData.id)
            .single();

          if (topicData) {
            query = query.eq('topic_id', topicData.id);
          }
        }

        // Execute query
        const { data: questionsData, error: questionsError } = await query
          .order('year', { ascending: false })
          .order('month', { ascending: false });

        if (questionsError) throw questionsError;
        
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
        setError('Failed to load practice data');
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

  // Check bookmark status and selected option when question changes
  useEffect(() => {
    if (currentQuestion) {
      const attempt = userAttempts[currentQuestion.id];
      setIsBookmarked(attempt?.is_bookmarked || false);
      
      // Only set selected option from attempt if it exists and we're not in the middle of answering
      if (attempt?.user_answer && !showSolution) {
        setSelectedOption(attempt.user_answer);
      } else if (!attempt && !showSolution) {
        // Only reset if no attempt exists and we're not showing solution
        setSelectedOption(null);
      }
    }
  }, [currentQuestion, userAttempts]);

  // Save user attempt - UPDATED to always overwrite existing attempts
  const saveAttempt = async (isCorrect, userAnswer = null) => {
    if (!currentQuestion || !user) return;

    try {
      setSubmitting(true);

      // Use the provided userAnswer or fall back to selectedOption
      const finalUserAnswer = userAnswer !== null ? userAnswer : selectedOption;

      const attemptData = {
        user_id: user.id,
        question_id: currentQuestion.id,
        chapter_id: currentQuestion.chapter_id,
        user_answer: finalUserAnswer,
        is_correct: isCorrect,
        time_taken: timer,
        question_difficulty: currentQuestion.difficulty_category,
        question_type: currentQuestion.question_type,
        is_bookmarked: isBookmarked,
        attempted_at: new Date().toISOString(),
        // Add attempt_count to track multiple attempts
        attempt_count: (userAttempts[currentQuestion.id]?.attempt_count || 0) + 1
      };

      const existingAttempt = userAttempts[currentQuestion.id];

      let error;
      if (existingAttempt) {
        // Always update existing attempt with new data (overwrite)
        const { error: updateError } = await supabase
          .from('user_question_attempts')
          .update(attemptData)
          .eq('id', existingAttempt.id);
        error = updateError;
      } else {
        // Create new attempt
        const { error: insertError } = await supabase
          .from('user_question_attempts')
          .insert([attemptData]);
        error = insertError;
      }

      if (error) throw error;

      // Refresh attempts to get the latest data
      await fetchUserAttempts(questions.map(q => q.id));

    } catch (err) {
      console.error('Error saving attempt:', err);
      alert('Error saving your attempt. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check answer
  const checkAnswer = () => {
    if (!currentQuestion || !selectedOption) {
      alert('Please select an answer first!');
      return;
    }

    let isCorrect = false;
    
    if (currentQuestion.question_type === 'objective') {
      isCorrect = selectedOption === correctAnswerId;
    } else {
      const userValue = parseFloat(selectedOption);
      const correctValue = parseFloat(rawCorrectAnswer?.value);
      isCorrect = !isNaN(userValue) && !isNaN(correctValue) && userValue === correctValue;
    }
    
    // Save attempt and show solution
    saveAttempt(isCorrect, selectedOption);
    setShowSolution(true);

    setTimeout(() => {
      solutionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };

  // Navigate to next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowSolution(false);
      // Reset timer for the new question
      setTimer(0);
    }
  };

  // Navigate to previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowSolution(false);
      // Reset timer for the new question
      setTimer(0);
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
        const { error } = await supabase
          .from('user_question_attempts')
          .update({ 
            is_bookmarked: newBookmarkState,
            attempted_at: new Date().toISOString()
          })
          .eq('id', existingAttempt.id);

        if (error) throw error;
      } else {
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

      await fetchUserAttempts(questions.map(q => q.id));

    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setIsBookmarked(!isBookmarkState);
      alert('Error updating bookmark. Please try again.');
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
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl overflow-hidden">
            {/* Question Header */}
            <div className="border-b border-gray-700 p-4 bg-gray-800/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 bg-blue-600/20 px-3 py-1 rounded-full">
                    <FiCalendar className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-300 text-xs md:text-sm font-medium">
                      {formatExamDate(currentQuestion.year, currentQuestion.month, currentQuestion.shift)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-green-600/20 px-3 py-1 rounded-full">
                    <span className="text-green-300 text-xs md:text-sm font-medium capitalize">
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
            <div className="p-6 bg-gray-800/30">
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
                    correctAnswer={correctAnswerId}
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
                  className="border-t border-gray-700 bg-gray-800/30"
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
                            {currentAttempt.attempt_count > 1 && (
                              <p className="text-gray-400 text-xs mt-1">
                                Attempt #{currentAttempt.attempt_count}
                              </p>
                            )}
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