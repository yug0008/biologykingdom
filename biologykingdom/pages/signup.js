import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AuthCard from '../components/AuthCard'
import Button from '../components/Button'
import Input from '../components/Input'
import { FcGoogle } from 'react-icons/fc'
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiPhone, FiBook } from 'react-icons/fi'

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    exams: []
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (user && !authLoading) router.push('/profile')
  }, [user, authLoading, router])

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleExamToggle = (examId) => {
    setFormData(prev => ({
      ...prev,
      exams: prev.exams.includes(examId)
        ? prev.exams.filter(id => id !== examId)
        : [...prev.exams, examId]
    }))
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // First, sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
            exams: formData.exams
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // The user profile will be created automatically by our trigger
        // or we can wait for the user to be signed in and handle it in the auth hook
        
        // Show success message and redirect to login
        router.push('/login?registered=true&email=' + encodeURIComponent(formData.email))
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError(error.message || 'An error occurred during signup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      setLoading(true)
      setError('')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile`
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
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (user && !authLoading) return null

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start p-4 relative overflow-hidden">
      {/* Simplified Header */}
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
          
          {/* Signup Form - First on Mobile */}
          <div className="w-full max-w-2xl order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AuthCard 
                title="Create Account" 
                subtitle="Join our learning community today"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm text-center mb-4 font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Name and Phone in same row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                      icon={<FiUser className="text-gray-400" />}
                    />
                    
                    <Input
                      label="Phone Number (Optional)"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter your phone"
                      icon={<FiPhone className="text-gray-400" />}
                    />
                  </div>

                  {/* Email and Password in same row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      icon={<FiMail className="text-gray-400" />}
                    />
                    
                    <Input
                      label="Password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create password"
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
                  </div>

                  {/* Exams Selection */}
                  <div className="space-y-3">
                    <label className="block text-gray-200 text-sm font-semibold tracking-wide">
                      Which exams are you preparing for? (Optional)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'jee', label: 'JEE' },
                        { id: 'neet', label: 'NEET' },
                        { id: 'ssc', label: 'SSC' },
                        { id: 'railways', label: 'Railways' },
                        { id: 'boards', label: 'Boards' },
                        { id: 'other', label: 'Other' }
                      ].map((exam) => (
                        <motion.label
                          key={exam.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer 
                            transition-all duration-200 text-sm font-semibold tracking-wide text-center
                            ${formData.exams.includes(exam.id)
                              ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={formData.exams.includes(exam.id)}
                            onChange={() => handleExamToggle(exam.id)}
                            className="hidden"
                          />
                          {exam.label}
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    loading={loading}
                    className="mt-4 w-full font-semibold tracking-wide py-3 text-base"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
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
                    onClick={handleGoogleSignup}
                    type="button"
                    disabled={loading}
                    className="w-full font-semibold tracking-wide py-3 text-base"
                  >
                    <FcGoogle size={20} />
                    Sign up with Google
                  </Button>

                  <p className="text-center text-gray-400 text-sm mt-6 font-medium tracking-wide">
                    Already have an account?{' '}
                    <a 
                      href="/login" 
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      Sign in
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

              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent font-extrabold">
                  Begin Your
                  <br />
                  Success Story
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed font-medium tracking-wide max-w-lg">
                Join 50,000+ students who are transforming their academic journey with personalized learning experiences and expert guidance.
              </p>

              <div className="space-y-4 mb-8 max-w-md">
                <div className="flex items-center gap-3 text-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium tracking-wide">Get matched with perfect study materials</span>
                </div>
                <div className="flex items-center gap-3 text-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium tracking-wide">Track your progress with smart analytics</span>
                </div>
                <div className="flex items-center gap-3 text-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium tracking-wide">Join live classes and doubt sessions</span>
                </div>
                <div className="flex items-center gap-3 text-gray-200">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium tracking-wide">Access to 1000+ practice questions</span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-gray-700 max-w-md">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 tracking-tight">50K+</div>
                  <div className="text-sm text-gray-400 mt-1 font-medium">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 tracking-tight">95%</div>
                  <div className="text-sm text-gray-400 mt-1 font-medium">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 tracking-tight">500+</div>
                  <div className="text-sm text-gray-400 mt-1 font-medium">Educators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 tracking-tight">24/7</div>
                  <div className="text-sm text-gray-400 mt-1 font-medium">Support</div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 pt-6 border-t border-gray-700 max-w-md">
                <p className="text-gray-400 text-sm text-center lg:text-left mb-3 font-semibold tracking-wide">Trusted by students from</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-gray-300 text-sm font-medium tracking-wide">
                  <span>IITs</span>
                  <span>•</span>
                  <span>AIIMS</span>
                  <span>•</span>
                  <span>NITs</span>
                  <span>•</span>
                  <span>Medical Colleges</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}