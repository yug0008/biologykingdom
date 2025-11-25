import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AvatarUploader from '../components/AvatarUploader'
import Button from '../components/Button'
import { FiSettings, FiLogOut, FiUser, FiMail, FiPhone, FiBook, FiCalendar } from 'react-icons/fi'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/login')
      return
    }
    
    if (user && !authLoading) {
      fetchProfile()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    try {
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !data) {
        const newProfile = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          profile_pic_url: user.user_metadata?.avatar_url,
          phone: user.user_metadata?.phone || '',
          exams: user.user_metadata?.exams || [],
          created_at: new Date().toISOString()
        }

        const { data: insertedData } = await supabase
          .from('users')
          .insert([newProfile])
          .select()
          .single()

        data = insertedData
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        profile_pic_url: user.user_metadata?.avatar_url,
        phone: user.user_metadata?.phone || '',
        exams: user.user_metadata?.exams || [],
        created_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (url) => {
    try {
      await supabase
        .from('users')
        .update({ 
          profile_pic_url: url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      setProfile(prev => ({ ...prev, profile_pic_url: url }))
    } catch (error) {
      console.error('Error updating profile picture:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const goToSettings = () => {
    router.push('/settings')
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading your profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl mb-4">Profile Not Found</h2>
          <Button onClick={fetchProfile}>
            Retry Loading Profile
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Dark Background with subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900"></div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 shadow-xl"
                >
                  <div className="text-center mb-6">
                    <AvatarUploader 
                      url={profile.profile_pic_url} 
                      onUpload={handleAvatarUpload}
                      size={120}
                    />
                  </div>
                  
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {profile.name}
                    </h2>
                    <p className="text-gray-300">{profile.email}</p>
                    {profile.created_at && (
                      <p className="text-gray-500 text-sm mt-2">
                        Member since {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={goToSettings}
                      className="w-full flex items-center justify-center gap-2 py-3"
                    >
                      <FiSettings className="w-5 h-5" />
                      Edit Profile 
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-3"
                    >
                      <FiLogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </div>
                </motion.div>
              </div>

              {/* Info Card */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 lg:p-8 border border-gray-700 shadow-xl"
                >
                  
                  <div className="space-y-6">
                    {/* Name */}
                    <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
                      <div className="p-2 bg-purple-600 rounded-lg">
                        <FiUser className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Full Name</h3>
                        <p className="text-white text-lg">{profile.name}</p>
                      </div>
                    </div>

                    {/* Email */}
<div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
  <div className="p-2 bg-blue-600 rounded-lg">
    <FiMail className="w-5 h-5 text-white" />
  </div>
  <div className="flex-1 min-w-0"> {/* Add min-w-0 here */}
    <h3 className="text-gray-400 text-sm font-medium mb-1">Email Address</h3>
    <p className="text-white text-lg truncate"> {/* Add truncate class */}
      {profile.email}
    </p>
  </div>
</div>

                    {/* Phone */}
                    <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
                      <div className="p-2 bg-green-600 rounded-lg">
                        <FiPhone className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Phone Number</h3>
                        <p className="text-white text-lg">{profile.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Exams */}
                    <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
                      <div className="p-2 bg-yellow-600 rounded-lg">
                        <FiBook className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Preparing For</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.exams && profile.exams.length > 0 ? (
                            profile.exams.map((exam) => (
                              <span
                                key={exam}
                                className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium"
                              >
                                {exam.toUpperCase()}
                              </span>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm">No exams selected</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-start gap-4 p-4 bg-gray-700/50 rounded-xl">
                      <div className="p-2 bg-indigo-600 rounded-lg">
                        <FiCalendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-400 text-sm font-medium mb-1">Member Since</h3>
                        <p className="text-white text-lg">
                          {profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Recently joined'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-600">
                    {[
                      { label: 'Courses', value: '12', color: 'text-blue-400' },
                      { label: 'Hours', value: '156', color: 'text-green-400' },
                      { label: 'Streak', value: '7 days', color: 'text-yellow-400' },
                      { label: 'Level', value: 'Advanced', color: 'text-purple-400' }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="text-center p-4 bg-gray-700/30 rounded-xl"
                      >
                        <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                          {stat.value}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {stat.label}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}