import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AuthCard from '../components/AuthCard'
import Button from '../components/Button'
import Input from '../components/Input'
import { FcGoogle } from 'react-icons/fc'
import { FiEye, FiEyeOff, FiMail, FiLock, FiBook } from 'react-icons/fi'
import Head from 'next/head'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    console.log('Auth state - User:', user, 'Loading:', authLoading)
    
    // If user is authenticated and not loading, redirect to profile
    if (user && !authLoading) {
      console.log('User authenticated, redirecting to profile')
      router.push('/profile')
    }
    
    if (router.query.registered === 'true') {
      setSuccess('Account created successfully! Please sign in.')
    }
  }, [user, authLoading, router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      console.log('Attempting login with:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })
      
      console.log('Login response:', { data, error })
      
      if (error) {
        console.error('Login error:', error)
        throw error
      }
      
      if (data.user) {
        console.log('Login successful, user:', data.user)
        setSuccess('Login successful! Redirecting...')
        
        // Manual redirect as fallback
        setTimeout(() => {
          console.log('Manual redirect to profile')
          router.push('/profile')
        }, 1500)
      }
    } catch (error) {
      console.error('Login catch error:', error)
      setError(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError('')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Checking authentication...</div>
      </div>
    )
  }

  // Only return null if user exists and we're not loading
  if (user && !authLoading) {
    console.log('User exists, not rendering login page')
    return null
  }

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start p-4 relative overflow-hidden">
        {/* Header - Same as Signup Page */}
        <div className="relative w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
          {/* Back Button */}
          <button 
            onClick={() => router.back()}
            className="absolute left-4 top-4 p-2 rounded-full bg-white/90 backdrop-blur shadow hover:bg-white transition-colors z-10"
          >
            <svg width="22" height="22" fill="none" stroke="black" strokeWidth="2">
              <path d="M15 5 L7 11 L15 17" />
            </svg>
          </button>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900 to-gray-900"></div>
        
        {/* Main Content Container */}
        <div className="relative z-50 w-full max-w-6xl mt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
            
            {/* Login Form - First on Mobile */}
            <div className="w-full max-w-md order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <AuthCard 
                  title="Welcome Back" 
                  subtitle="Sign in to your account"
                >
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm text-center mb-4 font-medium tracking-wide"
                    >
                      {success}
                    </motion.div>
                  )}
                  
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm text-center mb-4 font-medium tracking-wide"
                    >
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      icon={<FiMail className="text-gray-400" />}
                    />
                    
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      icon={<FiLock className="text-gray-400" />}
                      endIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </button>
                      }
                    />

                    <div className="flex justify-end">
                      <a href="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm font-semibold tracking-wide transition-colors">
                        Forgot password?
                      </a>
                    </div>

                    <Button 
                      type="submit" 
                      loading={loading}
                      className="mt-2 w-full font-semibold tracking-wide py-3 text-base"
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-900 px-2 text-gray-400 font-medium tracking-wide">Or continue with</span>
                      </div>
                    </div>

                    <Button 
                      variant="google" 
                      onClick={handleGoogleLogin}
                      type="button"
                      disabled={loading}
                      className="w-full font-semibold tracking-wide py-3 text-base"
                    >
                      <FcGoogle size={20} />
                      Sign in with Google
                    </Button>

                    <p className="text-center text-gray-400 text-sm mt-6 font-medium tracking-wide">
                      Don't have an account?{' '}
                      <a 
                        href="/signup" 
                        className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        Create account
                      </a>
                    </p>
                  </form>
                </AuthCard>
              </motion.div>
            </div>

            {/* Hero Section - Second on Mobile */}
            <div className="w-full max-w-2xl order-2 lg:order-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white"
              >
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                  <div className="flex items-center justify-center h-16 px-4">
                    <img
                      src="https://learnverse-sigma.vercel.app/logolv.png"
                      alt="Logo"
                      width={160}
                      height={55}
                      className="invert"
                    />
                  </div>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight font-poppins">
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-extrabold">
                    Learn Smarter.
                    <br />
                    Learn Faster.
                  </span>
                </h1>
                
                <p className="text-xl text-gray-300 mb-8 leading-relaxed font-medium tracking-wide max-w-lg font-inter">
                  Join millions of students mastering their exams with our intelligent learning platform designed for modern education.
                </p>

                <div className="space-y-4 mb-8 max-w-md">
                  <div className="flex items-center gap-3 text-gray-200">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FiBook className="text-white text-sm" />
                    </div>
                    <span className="font-medium tracking-wide font-inter">Personalized learning paths</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-200">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium tracking-wide font-inter">AI-powered study recommendations</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-200">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium tracking-wide font-inter">Progress tracking & analytics</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-700 max-w-md">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 tracking-tight font-poppins">50K+</div>
                    <div className="text-sm text-gray-400 mt-1 font-semibold tracking-wide font-inter">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 tracking-tight font-poppins">95%</div>
                    <div className="text-sm text-gray-400 mt-1 font-semibold tracking-wide font-inter">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 tracking-tight font-poppins">24/7</div>
                    <div className="text-sm text-gray-400 mt-1 font-semibold tracking-wide font-inter">Support</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}