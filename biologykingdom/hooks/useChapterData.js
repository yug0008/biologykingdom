import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Fetch exam data
const fetchExamData = async (examSlug) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('slug', examSlug)
    .single();
  
  if (error) throw error;
  return data;
};

// Fetch subject data
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

// Fetch chapter data
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

// Fetch topics
const fetchTopics = async (chapterId) => {
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('order');
  
  if (error) throw error;
  return data || [];
};

// Fetch questions
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

// Fetch user's question attempts
const fetchUserAttempts = async (userId, chapterId) => {
  if (!userId || !chapterId) return [];
  
  const { data, error } = await supabase
    .from('user_question_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('chapter_id', chapterId);
  
  if (error) throw error;
  return data || [];
};

// Fetch bookmarked questions
const fetchBookmarkedQuestions = async (userId, chapterId) => {
  if (!userId || !chapterId) return [];
  
  const { data, error } = await supabase
    .from('user_question_attempts')
    .select(`
      *,
      questions (*)
    `)
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .eq('is_bookmarked', true);
  
  if (error) throw error;
  return data || [];
};

// Fetch incorrect questions (mistakes)
const fetchIncorrectQuestions = async (userId, chapterId) => {
  if (!userId || !chapterId) return [];
  
  const { data, error } = await supabase
    .from('user_question_attempts')
    .select(`
      *,
      questions (*)
    `)
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .eq('is_correct', false);
  
  if (error) throw error;
  return data || [];
};

// Fetch user progress from user_question_attempts
const fetchUserProgress = async (chapterId, userId) => {
  if (!userId) return null;

  try {
    // Get all attempts for this chapter
    const { data: attempts, error } = await supabase
      .from('user_question_attempts')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('user_id', userId);

    if (error) throw error;

    // Calculate progress stats
    const { count: totalQuestionsCount } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)
      .eq('category', 'PYQ');

    // Get unique attempted questions
    const attemptedQuestions = new Set(attempts?.map(attempt => attempt.question_id) || []).size;
    const correctQuestions = attempts?.filter(attempt => attempt.is_correct).length || 0;
    const incorrectQuestions = attempts?.filter(attempt => !attempt.is_correct).length || 0;
    const timeSpent = attempts?.reduce((total, attempt) => total + (attempt.time_taken || 0), 0) || 0;

    const accuracy = attemptedQuestions > 0 
      ? Math.round((correctQuestions / attemptedQuestions) * 100)
      : 0;

    return {
      total_questions: totalQuestionsCount || 0,
      attempted_questions: attemptedQuestions,
      correct_questions: correctQuestions,
      incorrect_questions: incorrectQuestions,
      accuracy,
      time_spent: timeSpent,
      last_attempted: attempts?.length > 0 
        ? new Date(Math.max(...attempts.map(a => new Date(a.attempted_at)))) 
        : null,
      completed: attemptedQuestions >= (totalQuestionsCount || 0)
    };
  } catch (err) {
    console.error('Error fetching user progress:', err);
    return null;
  }
};

// Main hook for chapter data
export const useChapterData = (examSlug, subjectSlug, chapterSlug, userId) => {
  return useQueries({
    queries: [
      {
        queryKey: ['exam', examSlug],
        queryFn: () => fetchExamData(examSlug),
        enabled: !!examSlug,
      },
      {
        queryKey: ['subject', examSlug, subjectSlug],
        queryFn: async () => {
          const examData = await fetchExamData(examSlug);
          return fetchSubjectData(subjectSlug, examData.id);
        },
        enabled: !!examSlug && !!subjectSlug,
      },
      {
        queryKey: ['chapter', examSlug, subjectSlug, chapterSlug],
        queryFn: async () => {
          const examData = await fetchExamData(examSlug);
          const subjectData = await fetchSubjectData(subjectSlug, examData.id);
          return fetchChapterData(chapterSlug, subjectData.id);
        },
        enabled: !!examSlug && !!subjectSlug && !!chapterSlug,
      },
      {
        queryKey: ['topics', examSlug, subjectSlug, chapterSlug],
        queryFn: async () => {
          const examData = await fetchExamData(examSlug);
          const subjectData = await fetchSubjectData(subjectSlug, examData.id);
          const chapterData = await fetchChapterData(chapterSlug, subjectData.id);
          return fetchTopics(chapterData.id);
        },
        enabled: !!examSlug && !!subjectSlug && !!chapterSlug,
      },
      {
        queryKey: ['questions', examSlug, subjectSlug, chapterSlug],
        queryFn: async () => {
          const examData = await fetchExamData(examSlug);
          const subjectData = await fetchSubjectData(subjectSlug, examData.id);
          const chapterData = await fetchChapterData(chapterSlug, subjectData.id);
          return fetchQuestions(chapterData.id);
        },
        enabled: !!examSlug && !!subjectSlug && !!chapterSlug,
      },
      {
        queryKey: ['user-progress', examSlug, subjectSlug, chapterSlug, userId],
        queryFn: async () => {
          const examData = await fetchExamData(examSlug);
          const subjectData = await fetchSubjectData(subjectSlug, examData.id);
          const chapterData = await fetchChapterData(chapterSlug, subjectData.id);
          return fetchUserProgress(chapterData.id, userId);
        },
        enabled: !!examSlug && !!subjectSlug && !!chapterSlug && !!userId,
      }
    ]
  });
};

// Hook for individual menu items with separate query keys
export const useMenuData = (menuId, examSlug, subjectSlug, chapterSlug, userId) => {
  // Import queryClient inside the function to avoid circular dependencies
  const { queryClient } = require('../lib/react-query');
  
  const queryConfigs = {
    'overview': {
      queryKey: ['overview', examSlug, subjectSlug, chapterSlug],
      queryFn: async () => {
        const [examData, subjectData, chapterData, topics, questions, userProgress] = await Promise.all([
          queryClient.getQueryData(['exam', examSlug]) || fetchExamData(examSlug),
          queryClient.getQueryData(['subject', examSlug, subjectSlug]) || (async () => {
            const exam = await fetchExamData(examSlug);
            return fetchSubjectData(subjectSlug, exam.id);
          })(),
          queryClient.getQueryData(['chapter', examSlug, subjectSlug, chapterSlug]) || (async () => {
            const exam = await fetchExamData(examSlug);
            const subject = await fetchSubjectData(subjectSlug, exam.id);
            return fetchChapterData(chapterSlug, subject.id);
          })(),
          queryClient.getQueryData(['topics', examSlug, subjectSlug, chapterSlug]) || (async () => {
            const exam = await fetchExamData(examSlug);
            const subject = await fetchSubjectData(subjectSlug, exam.id);
            const chapter = await fetchChapterData(chapterSlug, subject.id);
            return fetchTopics(chapter.id);
          })(),
          queryClient.getQueryData(['questions', examSlug, subjectSlug, chapterSlug]) || (async () => {
            const exam = await fetchExamData(examSlug);
            const subject = await fetchSubjectData(subjectSlug, exam.id);
            const chapter = await fetchChapterData(chapterSlug, subject.id);
            return fetchQuestions(chapter.id);
          })(),
          queryClient.getQueryData(['user-progress', examSlug, subjectSlug, chapterSlug, userId]) || (async () => {
            const exam = await fetchExamData(examSlug);
            const subject = await fetchSubjectData(subjectSlug, exam.id);
            const chapter = await fetchChapterData(chapterSlug, subject.id);
            return fetchUserProgress(chapter.id, userId);
          })()
        ]);

        return { examData, subjectData, chapterData, topics, questions, userProgress };
      },
      enabled: !!examSlug && !!subjectSlug && !!chapterSlug
    },
    'all-pyqs': {
      queryKey: ['all-pyqs', examSlug, subjectSlug, chapterSlug],
      queryFn: async () => {
        const questions = queryClient.getQueryData(['questions', examSlug, subjectSlug, chapterSlug]) || 
          await (async () => {
            const exam = await fetchExamData(examSlug);
            const subject = await fetchSubjectData(subjectSlug, exam.id);
            const chapter = await fetchChapterData(chapterSlug, subject.id);
            return fetchQuestions(chapter.id);
          })();
        return { questions };
      },
      enabled: !!examSlug && !!subjectSlug && !!chapterSlug
    },
    'topic-wise': {
      queryKey: ['topic-wise', examSlug, subjectSlug, chapterSlug],
      queryFn: async () => {
        const [topics, questions] = await Promise.all([
          queryClient.getQueryData(['topics', examSlug, subjectSlug, chapterSlug]) || 
            await (async () => {
              const exam = await fetchExamData(examSlug);
              const subject = await fetchSubjectData(subjectSlug, exam.id);
              const chapter = await fetchChapterData(chapterSlug, subject.id);
              return fetchTopics(chapter.id);
            })(),
          queryClient.getQueryData(['questions', examSlug, subjectSlug, chapterSlug]) || 
            await (async () => {
              const exam = await fetchExamData(examSlug);
              const subject = await fetchSubjectData(subjectSlug, exam.id);
              const chapter = await fetchChapterData(chapterSlug, subject.id);
              return fetchQuestions(chapter.id);
            })()
        ]);
        return { topics, questions };
      },
      enabled: !!examSlug && !!subjectSlug && !!chapterSlug
    },
    'bookmarked': {
      queryKey: ['bookmarked', examSlug, subjectSlug, chapterSlug, userId],
      queryFn: async () => {
        const examData = await fetchExamData(examSlug);
        const subjectData = await fetchSubjectData(subjectSlug, examData.id);
        const chapterData = await fetchChapterData(chapterSlug, subjectData.id);
        const bookmarked = await fetchBookmarkedQuestions(userId, chapterData.id);
        return { bookmarked };
      },
      enabled: !!examSlug && !!subjectSlug && !!chapterSlug && !!userId
    },
    'mistakes': {
      queryKey: ['mistakes', examSlug, subjectSlug, chapterSlug, userId],
      queryFn: async () => {
        const examData = await fetchExamData(examSlug);
        const subjectData = await fetchSubjectData(subjectSlug, examData.id);
        const chapterData = await fetchChapterData(chapterSlug, subjectData.id);
        const incorrect = await fetchIncorrectQuestions(userId, chapterData.id);
        return { incorrect };
      },
      enabled: !!examSlug && !!subjectSlug && !!chapterSlug && !!userId
    }
  };

  const config = queryConfigs[menuId] || {
    queryKey: [menuId, examSlug, subjectSlug, chapterSlug],
    queryFn: () => Promise.resolve({}),
    enabled: false
  };

  return useQuery(config);
};

// Hook for question data (attempts, bookmarked, incorrect)
export const useQuestionData = (activeMenu, examSlug, subjectSlug, chapterSlug, userId) => {
  return useQuery({
    queryKey: ['question-data', activeMenu, examSlug, subjectSlug, chapterSlug, userId],
    queryFn: async () => {
      if (!examSlug || !subjectSlug || !chapterSlug || !userId) {
        return { attempts: [], bookmarked: [], incorrect: [] };
      }

      const examData = await fetchExamData(examSlug);
      const subjectData = await fetchSubjectData(subjectSlug, examData.id);
      const chapterData = await fetchChapterData(chapterSlug, subjectData.id);
      const chapterId = chapterData.id;

      const [attempts, bookmarked, incorrect] = await Promise.all([
        fetchUserAttempts(userId, chapterId),
        fetchBookmarkedQuestions(userId, chapterId),
        fetchIncorrectQuestions(userId, chapterId)
      ]);

      return { attempts, bookmarked, incorrect };
    },
    enabled: !!examSlug && !!subjectSlug && !!chapterSlug && !!userId,
  });
};