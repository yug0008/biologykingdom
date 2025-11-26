// pages/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch exams data
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError('');

        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .order('name');

        if (examsError) throw examsError;

        // Fetch question counts for each exam
        const examsWithStats = await Promise.all(
          examsData.map(async (exam) => {
            const { count: pyqCount, error: countError } = await supabase
              .from('questions')
              .select('*', { count: 'exact', head: true })
              .eq('exam_id', exam.id)
              .eq('category', 'PYQ');

            if (countError) console.error('Error counting questions:', countError);

            return {
              ...exam,
              pyqCount: pyqCount || 0
            };
          })
        );

        setExams(examsWithStats);
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Failed to load exams');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Filter exams based on search
  const filteredExams = exams.filter(exam =>
    exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Exams | Study Platform</title>
        <meta name="description" content="Browse all available exams and start practicing" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-gray-900 to-gray-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(120,119,198,0.1),_rgba(255,255,255,0))]"></div>
        
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        {/* Header */}
        <header className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          

            {/* Search Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl mx-auto mt-8"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exams... (JEE, NEET, SSC, etc.)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-inter text-lg"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-white font-poppins">{exams.length}</div>
                <div className="text-gray-300 font-inter mt-1">Total Exams</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-white font-poppins">
                  {exams.reduce((total, exam) => total + exam.pyqCount, 0).toLocaleString()}
                </div>
                <div className="text-gray-300 font-inter mt-1">PYQ Questions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold text-white font-poppins">24/7</div>
                <div className="text-gray-300 font-inter mt-1">Available</div>
              </div>
            </motion.div>

            {/* Exams Grid */}
            {filteredExams.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredExams.map((exam, index) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="group cursor-pointer"
                    onClick={() => router.push(`/pyq/exams/${exam.slug}`)}
                  >
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-6 hover:bg-white/15 hover:border-white/30 transition-all duration-300 h-full flex flex-col">
                      {/* Exam Logo and Header */}
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                          {exam.logo_url ? (
                            <img 
                              src={exam.logo_url} 
                              alt={exam.name}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <span className="text-white font-bold text-xl">
                              {exam.name.split(' ').map(word => word[0]).join('')}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white truncate font-poppins group-hover:text-purple-200 transition-colors">
                            {exam.name}
                          </h3>
                          <p className="text-gray-400 text-sm font-inter mt-1">
                            {exam.year_range}
                          </p>
                        </div>
                      </div>

                      {/* Question Count */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm font-inter">PYQ Questions</span>
                          <span className="text-white font-semibold bg-purple-500/20 px-3 py-1 rounded-full text-sm">
                            {exam.pyqCount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min((exam.pyqCount / 1000) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 transform group-hover:scale-105 font-inter">
                          Start Practicing
                          <svg 
                            className="w-4 h-4 ml-2 inline-block transform group-hover:translate-x-1 transition-transform" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>

                      {/* Hover Effect */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="text-center py-16"
              >
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2 font-poppins">No exams found</h3>
                <p className="text-gray-400 font-inter">
                  {searchTerm ? `No exams matching "${searchTerm}"` : 'No exams available at the moment'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-inter"
                  >
                    Clear Search
                  </button>
                )}
              </motion.div>
            )}

            {/* Features Section */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-20"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4 font-poppins">
                  Why Choose Our Platform?
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto font-inter">
                  Everything you need to ace your exams in one place
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 font-poppins">Authentic PYQs</h3>
                  <p className="text-gray-400 font-inter">
                    Curated previous year questions with verified solutions
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 font-poppins">Smart Analytics</h3>
                  <p className="text-gray-400 font-inter">
                    Track your progress and identify weak areas
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 font-poppins">Comprehensive Coverage</h3>
                  <p className="text-gray-400 font-inter">
                    All major exams and subjects covered
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-400 font-inter">
              &copy; 2024 Study Platform. Empowering students worldwide.
            </p>
          </div>
        </footer>
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        * {
          transition-property: color, background-color, border-color, transform, box-shadow;
          transition-duration: 200ms;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}