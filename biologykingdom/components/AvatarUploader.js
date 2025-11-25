import { motion } from 'framer-motion'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const styles = `
  .avatar-uploader-container {
    position: relative;
    display: inline-block;
  }
  
  .avatar-image {
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid rgba(255, 255, 255, 0.2);
    object-fit: cover;
  }
  
  .avatar-upload-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .avatar-upload-label {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    background: #6366f1;
    color: white;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .avatar-upload-input {
    display: none;
  }
  
  .avatar-spinner {
    width: 2rem;
    height: 2rem;
    border: 2px solid white;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: avatar-spin 1s linear infinite;
  }
  
  @keyframes avatar-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

export default function AvatarUploader({ url, onUpload, size = 120 }) {
  const [uploading, setUploading] = useState(false)

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)

      const file = event.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      onUpload(publicUrl)
    } catch (error) {
      alert('Error uploading avatar!')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <style jsx>{styles}</style>
      <motion.div 
        className="avatar-uploader-container"
        whileHover={{ scale: 1.05 }}
      >
        <div className="relative rounded-full overflow-hidden border-4 border-white/20">
          <img
            src={url || '/default-avatar.png'}
            alt="Avatar"
            className="avatar-image"
            style={{ width: size, height: size }}
          />
          {uploading && (
            <div className="avatar-upload-overlay">
              <div className="avatar-spinner" />
            </div>
          )}
        </div>
        
        <motion.label
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="avatar-upload-label"
        >
          <input
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
            className="avatar-upload-input"
          />
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </motion.label>
      </motion.div>
    </>
  )
}