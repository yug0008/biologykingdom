import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheck } from 'react-icons/fi';

const SortOverlay = ({ isOpen, onClose, sortConfig, onSortChange, questionCount }) => {
  const sortOptions = [
    {
      id: 'difficulty',
      label: 'Difficulty Level',
      options: [
        { value: 'all', label: 'All Difficulties' },
        { value: 'easy', label: 'Easy' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'tough', label: 'Tough' }
      ]
    },
    {
      id: 'difficulty_category',
      label: 'Difficulty Category',
      options: [
        { value: 'all', label: 'All Categories' },
        { value: 'Low Output Low Input', label: 'Low Output Low Input' },
        { value: 'Low Output High Input', label: 'Low Output High Input' },
        { value: 'High Output Low Input', label: 'High Output Low Input' },
        { value: 'High Output High Input', label: 'High Output High Input' }
      ]
    },
    {
      id: 'question_type',
      label: 'Question Type',
      options: [
        { value: 'all', label: 'All Types' },
        { value: 'objective', label: 'Objective' },
        { value: 'numerical', label: 'Numerical' }
      ]
    },
    {
      id: 'year',
      label: 'PYQ Year',
      options: [
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Overlay Panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-800 border-l border-slate-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white font-poppins">Sort & Filter</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Question Count */}
                <div className="text-center py-2">
                  <span className="text-sm text-gray-400">
                    {questionCount} question{questionCount !== 1 ? 's' : ''} found
                  </span>
                </div>

                {/* Sort Options */}
                {sortOptions.map((section) => (
                  <div key={section.id} className="space-y-3">
                    <h3 className="text-sm font-semibold text-white font-poppins">
                      {section.label}
                    </h3>
                    <div className="space-y-2">
                      {section.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => onSortChange(section.id, option.value)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 ${
                            sortConfig[section.id] === option.value
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-700/50 text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          <span className="text-sm font-medium">{option.label}</span>
                          {sortConfig[section.id] === option.value && (
                            <FiCheck className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
              <button
                onClick={() => onSortChange('reset')}
                className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors text-sm"
              >
                Reset Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SortOverlay;