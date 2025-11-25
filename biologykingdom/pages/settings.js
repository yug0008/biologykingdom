import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/Button'
import Input from '../components/Input'
import { FiArrowLeft, FiSave } from 'react-icons/fi'

export default function Settings() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    exams: []
  })
  const router = useRouter()
  const { user } = useAuth()

  const availableExams = [
    { id: 'jee', label: 'JEE' },
    { id: 'neet', label: 'NEET' },
    { id: 'ssc', label: 'SSC' },
    { id: 'railways', label: 'Railways' },
    { id: 'boards', label: 'Boards' },
    { id: 'other', label: 'Other' }
  ]

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
      setFormData({
        name: data.name,
        phone: data.phone || '',
        exams: data.exams || []
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          name: formData.name.trim(),
          phone: formData.phone,
          exams: formData.exams
          // updated_at remove kar diya
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage('Profile updated successfully!')
      setTimeout(() => {
        setMessage('')
        router.push('/profile')
      }, 1500)
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleExamToggle = (examId) => {
    setFormData(prev => ({
      ...prev,
      exams: prev.exams.includes(examId)
        ? prev.exams.filter(id => id !== examId)
        : [...prev.exams, examId]
    }))
  }

  const goBack = () => {
    router.push('/profile')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={goBack}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
              <p className="text-gray-400">Update your personal information</p>
            </div>
          </div>

          {/* Settings Form */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            {message && (
              <div className={`p-4 rounded-lg mb-6 ${
                message.includes('Error') 
                  ? 'bg-red-900/20 border border-red-500 text-red-400' 
                  : 'bg-green-900/20 border border-green-500 text-green-400'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Full Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  className="w-full"
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              </div>

              {/* Exams Field */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Exams You're Preparing For
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableExams.map((exam) => (
                    <label
                      key={exam.id}
                      className={`
                        flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer 
                        transition-all duration-200 text-sm font-medium text-center
                        ${formData.exams.includes(exam.id)
                          ? 'bg-blue-600 border-blue-500 text-white'
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
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-700">
                <Button 
                  onClick={handleSave}
                  loading={saving}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <FiSave className="w-4 h-4" />
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={goBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}