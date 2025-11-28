import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Fetch exam data
export const useExamData = (examSlug, enabled = true) => {
  return useQuery({
    queryKey: ['exam', examSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('slug', examSlug)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!examSlug && enabled,
    keepPreviousData: false,
  })
}

// Fetch subjects for exam
export const useSubjects = (examId, enabled = true) => {
  return useQuery({
    queryKey: ['subjects', examId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('exam_id', examId)
        .order('order')
      
      if (error) throw error
      return data
    },
    enabled: !!examId && enabled,
    keepPreviousData: false,
  })
}

// Fetch chapters with stats for subject
export const useChaptersWithStats = (subjectId, enabled = true) => {
  return useQuery({
    queryKey: ['chapters-with-stats', subjectId],
    queryFn: async () => {
      if (!subjectId) return []

      // Fetch chapters
      const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectId)
        .order('order')

      if (chaptersError) throw chaptersError

      // Fetch stats for each chapter
      const chaptersWithStats = await Promise.all(
        chapters.map(async (chapter) => {
          const [totalQuestions, recentStats, difficultyStats] = await Promise.all([
            // Total questions count
            supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('chapter_id', chapter.id)
              .eq('category', 'PYQ'),
            
            // Recent years stats (last 2 years)
            (async () => {
              const currentYear = new Date().getFullYear()
              const stats = []
              
              for (let year = currentYear; year >= currentYear - 1; year--) {
                const { count } = await supabase
                  .from('questions')
                  .select('*', { count: 'exact', head: true })
                  .eq('chapter_id', chapter.id)
                  .eq('category', 'PYQ')
                  .eq('year', year)
                
                if (count > 0) {
                  stats.push({ year, count })
                }
              }
              return stats
            })(),
            
            // Difficulty stats
            (async () => {
              const difficultyCategories = [
                'High Output High Input',
                'High Output Low Input', 
                'Low Output Low Input',
                'Low Output High Input'
              ]
              const stats = {}
              
              for (const difficulty of difficultyCategories) {
                const { count } = await supabase
                  .from('questions')
                  .select('*', { count: 'exact', head: true })
                  .eq('chapter_id', chapter.id)
                  .eq('category', 'PYQ')
                  .eq('difficulty_category', difficulty)
                
                stats[difficulty] = count || 0
              }
              return stats
            })()
          ])

          return {
            ...chapter,
            totalQuestions: totalQuestions.count || 0,
            recentStats,
            difficultyStats
          }
        })
      )

      return chaptersWithStats
    },
    enabled: !!subjectId && enabled,
    keepPreviousData: false,
  })
}