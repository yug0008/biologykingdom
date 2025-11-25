import { motion } from 'framer-motion'

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props 
}) {
  const baseClasses = `
    w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200 
    flex items-center justify-center gap-2 focus:outline-none focus:ring-2 
    focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 
    disabled:cursor-not-allowed ${className}
  `
  
  const variants = {
    primary: `
      bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
      text-white shadow-lg hover:shadow-xl focus:ring-blue-500
      ${!loading && !disabled ? 'hover:scale-[1.02]' : ''}
    `,
    google: `
      bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 
      shadow-md hover:shadow-lg focus:ring-gray-500
      ${!loading && !disabled ? 'hover:scale-[1.02]' : ''}
    `,
    outline: `
      border-2 border-gray-600 text-gray-200 hover:bg-gray-700 
      hover:border-gray-500 focus:ring-gray-500
      ${!loading && !disabled ? 'hover:scale-[1.02]' : ''}
    `
  }

  return (
    <motion.button
      whileHover={!loading && !disabled ? { scale: 1.02 } : {}}
      whileTap={!loading && !disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={loading || disabled}
      type={type}
      className={`${baseClasses} ${variants[variant]}`}
      {...props}
    >
      {loading && (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  )
}