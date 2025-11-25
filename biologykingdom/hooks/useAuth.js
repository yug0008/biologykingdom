// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        console.log('Session user:', session?.user)
        
        setUser(session?.user ?? null)
        setLoading(false)

        // If user just signed in, redirect to profile
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, should redirect to profile')
          // Use setTimeout to ensure state updates first
          setTimeout(() => {
            router.push('/profile')
          }, 100)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}