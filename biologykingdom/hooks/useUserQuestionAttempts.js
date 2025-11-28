// hooks/useUserQuestionAttempts.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const useUserQuestionAttempts = (userId, subjectId) => {
  return useQuery({
    queryKey: ['userQuestionAttempts', userId, subjectId],
    queryFn: async () => {
      if (!userId) return []

      let query = supabase
        .from('user_question_attempts')
        .select(`
          *,
          chapters!inner (
            id,
            subject_id
          )
        `)
        .eq('user_id', userId)

      if (subjectId) {
        query = query.eq('chapters.subject_id', subjectId)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Transform data to include subject_id from chapters
      return data?.map(attempt => ({
        ...attempt,
        subject_id: attempt.chapters?.subject_id
      })) || []
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}