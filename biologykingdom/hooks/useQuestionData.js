import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Fetch user's question attempts
export const fetchUserAttempts = async (userId, chapterId) => {
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
export const fetchBookmarkedQuestions = async (userId, chapterId) => {
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
export const fetchIncorrectQuestions = async (userId, chapterId) => {
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

// Custom hook for question data
export const useQuestionData = (activeMenu, exam, subject, chapter, userId) => {
  return useQuery({
    queryKey: ['question-data', activeMenu, chapter, userId],
    queryFn: async () => {
      if (!chapter || !userId) return { attempts: [], bookmarked: [], incorrect: [] };

      const [attempts, bookmarked, incorrect] = await Promise.all([
        fetchUserAttempts(userId, chapter),
        fetchBookmarkedQuestions(userId, chapter),
        fetchIncorrectQuestions(userId, chapter)
      ]);

      return { attempts, bookmarked, incorrect };
    },
    enabled: !!chapter && !!userId,
  });
};