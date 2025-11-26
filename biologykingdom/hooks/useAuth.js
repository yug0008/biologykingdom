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
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }
    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        // redirect sirf login/signup page par allow hoga
        const authPages = ["/login", "/signup"]

        if (event === "SIGNED_IN" && session?.user) {
          if (authPages.includes(router.pathname)) {
            router.replace("/profile")
          }
        }

        if (event === "SIGNED_OUT") {
          router.replace("/login")
        }
      }
    );

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
