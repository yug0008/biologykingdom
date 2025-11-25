import { motion } from 'framer-motion'
import { useState } from 'react'

export default function Input({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  error,
  icon,
  endIcon,
  placeholder,
  required = false,
  disabled = false,
  ...props 
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-gray-200 text-sm font-medium mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <motion.input
          whileFocus={{ scale: 1.01 }}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl
            text-white placeholder-gray-400 focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:border-transparent transition-all duration-200
            ${icon ? 'pl-11' : 'pl-4'}
            ${endIcon ? 'pr-11' : 'pr-4'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          placeholder={placeholder}
          disabled={disabled}
          {...props}
        />
        
        {endIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {endIcon}
          </div>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm mt-2 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.p>
      )}
    </div>
  )
}