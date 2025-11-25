import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import AvatarUploader from '../components/AvatarUploader'
import Button from '../components/Button'
import Input from '../components/Input'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchProfile()
  }, [user, router])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
      setEditName(data.name)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ name: editName.trim() })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, name: editName.trim() }))
      setEditMode(false)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (url) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ profile_pic_url: url })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => ({ ...prev, profile_pic_url: url }))
      setMessage('Profile picture updated!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error updating profile picture')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-purple-900 flex items-center justify-center">
        <div className="glass p-8">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-white">Loading your profile...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-gray-900 dark:to-purple-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Toast Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-4 right-4 glass p-4 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-2 text-white">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {message}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="container mx-auto p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass p-6 rounded-2xl shadow-xl"
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
                  <p className="text-white/70">{profile.email}</p>
                </div>

                <div className="space-y-4">
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </Button>
                  <Button variant="outline" onClick={handleLogout}>
                    Sign Out
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-8 rounded-2xl shadow-xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-bold text-white">Profile Information</h1>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Full Name
                    </label>
                    {editMode ? (
                      <div className="flex gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={handleSaveProfile} 
                          loading={saving}
                          className="w-auto px-4"
                        >
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setEditMode(false)
                            setEditName(profile.name)
                          }}
                          className="w-auto px-4"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="p-3 bg-white/10 rounded-xl text-white cursor-pointer hover:bg-white/20 transition-colors"
                        onClick={() => setEditMode(true)}
                      >
                        {profile.name}
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <div className="p-3 bg-white/10 rounded-xl text-white">
                      {profile.email}
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Phone Number
                    </label>
                    <div className="p-3 bg-white/10 rounded-xl text-white">
                      {profile.phone || 'Not provided'}
                    </div>
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">
                      Member Since
                    </label>
                    <div className="p-3 bg-white/10 rounded-xl text-white">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>

                {/* Exams Section */}
                <div className="mt-8">
                  <label className="block text-white/70 text-sm font-medium mb-4">
                    Preparing For
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {profile.exams && profile.exams.length > 0 ? (
                      profile.exams.map((exam) => (
                        <motion.span
                          key={exam}
                          whileHover={{ scale: 1.05 }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium shadow-lg"
                        >
                          {exam.toUpperCase()}
                        </motion.span>
                      ))
                    ) : (
                      <p className="text-white/60">No exams selected yet</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
                  {[
                    { label: 'Courses', value: '12' },
                    { label: 'Hours', value: '156' },
                    { label: 'Streak', value: '7 days' },
                    { label: 'Level', value: 'Advanced' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="text-center p-4 bg-white/5 rounded-xl"
                    >
                      <div className="text-2xl font-bold text-white mb-1">
                        {stat.value}
                      </div>
                      <div className="text-white/60 text-sm">
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}