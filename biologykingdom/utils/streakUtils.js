// utils/streakUtils.js
export const recordQuestionAttempt = async (userId, isCorrect) => {
  const today = new Date().toISOString().split('T')[0]
  
  // Get today's activity
  const { data: existingActivity } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  // Get user target
  const { data: targetData } = await supabase
    .from('user_targets')
    .select('daily_questions_target')
    .eq('user_id', userId)
    .single()

  const target = targetData?.daily_questions_target || 10

  const updateData = {
    questions_attempted: (existingActivity?.questions_attempted || 0) + 1,
    correct_answers: (existingActivity?.correct_answers || 0) + (isCorrect ? 1 : 0),
    incorrect_answers: (existingActivity?.incorrect_answers || 0) + (isCorrect ? 0 : 1),
    updated_at: new Date().toISOString()
  }

  // Check if target is achieved
  if (updateData.questions_attempted >= target) {
    updateData.target_achieved = true
  }

  if (existingActivity) {
    // Update existing record
    await supabase
      .from('user_streaks')
      .update(updateData)
      .eq('id', existingActivity.id)
  } else {
    // Create new record
    await supabase
      .from('user_streaks')
      .insert([{
        user_id: userId,
        date: today,
        ...updateData
      }])
  }

  return updateData
}