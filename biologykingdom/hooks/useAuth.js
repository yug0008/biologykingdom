import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        setLoading(false)
        
        if (event === 'SIGNED_IN' && currentUser) {
          // Check if user exists in profiles
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          if (error && error.code === 'PGRST116') { // Profile doesn't exist
            // Create profile for new user using the user_metadata
            const userMetadata = currentUser.user_metadata
            
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: currentUser.id,
                name: userMetadata.full_name || currentUser.email?.split('@')[0] || 'User',
                email: currentUser.email,
                phone: userMetadata.phone || null,
                exams: userMetadata.exams || [],
                profile_pic_url: userMetadata.avatar_url || '/default-avatar.png',
                created_at: new Date().toISOString()
              })

            if (insertError) {
              console.error('Error creating user profile:', insertError)
            }
          }
          
          router.push('/profile')
        }
        
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  return { user, loading }
}