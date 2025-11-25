import { motion } from 'framer-motion'

export default function AuthCard({ children, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gray-800/80 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 w-full shadow-2xl"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400">{subtitle}</p>
      </motion.div>
      {children}
    </motion.div>
  )
}