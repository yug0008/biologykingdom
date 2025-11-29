import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiBook, 
  FiArrowRight,
  FiFileText,
  FiStar,
  FiZap,
  FiTarget,
  FiAward,
  FiTrendingUp,
  FiShield,
  FiClock
} from 'react-icons/fi';
import { supabase } from '../../lib/supabase';

// Unique Thumbnail Design Component
const ThumbnailDesign = ({ designIndex, className }) => {
  const designs = [
    // Design 1: Geometric Pattern
    <div key="1" className={`absolute inset-0 opacity-20 ${className}`}>
      <div className="absolute top-2 left-2 w-8 h-8 border-2 border-white rounded-full"></div>
      <div className="absolute top-2 right-2 w-6 h-6 border border-white rotate-45"></div>
      <div className="absolute bottom-4 left-4 w-10 h-1 bg-white rounded-full"></div>
      <div className="absolute bottom-8 right-4 w-4 h-4 bg-white rounded-sm rotate-12"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border border-white rounded-lg rotate-45"></div>
    </div>,
    
    // Design 2: Circuit Board
    <div key="2" className={`absolute inset-0 opacity-15 ${className}`}>
      <div className="absolute top-3 left-3 w-16 h-1 bg-white rounded-full"></div>
      <div className="absolute top-3 left-3 w-1 h-12 bg-white rounded-full"></div>
      <div className="absolute top-8 right-4 w-12 h-1 bg-white rounded-full"></div>
      <div className="absolute bottom-6 left-6 w-1 h-8 bg-white rounded-full"></div>
      <div className="absolute bottom-4 right-6 w-8 h-1 bg-white rounded-full"></div>
      <div className="absolute top-1/2 right-8 w-1 h-10 bg-white rounded-full"></div>
      <div className="absolute top-10 left-8 w-6 h-6 border border-white rounded-full"></div>
    </div>,
    
    // Design 3: Molecular Structure
    <div key="3" className={`absolute inset-0 opacity-25 ${className}`}>
      <div className="absolute top-6 left-6 w-3 h-3 bg-white rounded-full"></div>
      <div className="absolute top-10 right-8 w-3 h-3 bg-white rounded-full"></div>
      <div className="absolute bottom-8 left-8 w-3 h-3 bg-white rounded-full"></div>
      <div className="absolute bottom-6 right-6 w-3 h-3 bg-white rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full"></div>
      <div className="absolute top-6 left-6 w-16 h-0.5 bg-white transform rotate-45 origin-left"></div>
      <div className="absolute top-6 left-6 w-16 h-0.5 bg-white transform -rotate-45 origin-left"></div>
    </div>,
    
    // Design 4: Wave Pattern
    <div key="4" className={`absolute inset-0 opacity-20 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path
          d="M0,50 Q25,30 50,50 T100,50"
          stroke="white"
          strokeWidth="1"
          fill="none"
          className="opacity-40"
        />
        <path
          d="M0,60 Q25,40 50,60 T100,60"
          stroke="white"
          strokeWidth="1"
          fill="none"
          className="opacity-30"
        />
        <path
          d="M0,70 Q25,50 50,70 T100,70"
          stroke="white"
          strokeWidth="1"
          fill="none"
          className="opacity-20"
        />
      </svg>
    </div>,
    
    // Design 5: Constellation
    <div key="5" className={`absolute inset-0 opacity-30 ${className}`}>
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            top: `${Math.random() * 80 + 10}%`,
            left: `${Math.random() * 80 + 10}%`,
          }}
        />
      ))}
      <div className="absolute top-1/4 left-1/4 w-0.5 h-6 bg-white transform -rotate-45"></div>
      <div className="absolute bottom-1/3 right-1/3 w-0.5 h-4 bg-white transform rotate-30"></div>
    </div>,
    
    // Design 6: Binary Code
    <div key="6" className={`absolute inset-0 opacity-15 ${className}`}>
      <div className="font-mono text-white text-xs absolute top-3 left-3">1010</div>
      <div className="font-mono text-white text-xs absolute top-8 right-4">1101</div>
      <div className="font-mono text-white text-xs absolute bottom-6 left-5">0110</div>
      <div className="font-mono text-white text-xs absolute bottom-4 right-3">1001</div>
      <div className="font-mono text-white text-xs absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">1110</div>
      <div className="absolute top-12 left-8 w-8 h-0.5 bg-white"></div>
      <div className="absolute bottom-12 right-8 w-6 h-0.5 bg-white"></div>
    </div>,
    
    // Design 7: Radar Sweep
    <div key="7" className={`absolute inset-0 opacity-20 ${className}`}>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-white origin-bottom rotate-45"></div>
    </div>,
    
    // Design 8: Chemical Formula
    <div key="8" className={`absolute inset-0 opacity-25 ${className}`}>
      <div className="absolute top-4 left-4 text-white text-sm font-bold">H₂O</div>
      <div className="absolute top-10 right-6 text-white text-sm font-bold">CO₂</div>
      <div className="absolute bottom-8 left-6 text-white text-sm font-bold">NaCl</div>
      <div className="absolute bottom-4 right-4 text-white text-sm font-bold">CH₄</div>
      <div className="absolute top-1/2 left-1/3 text-white text-xs">→</div>
      <div className="absolute top-1/2 right-1/3 text-white text-xs">+</div>
      <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 text-white text-xs">Δ</div>
    </div>
  ];

  return designs[designIndex % designs.length];
};

// Subject Block Component
const SubjectBlock = ({ subject, chapters, totalCards }) => {
  const router = useRouter();
  
  // Gradient backgrounds for chapter cards based on index
  const cardGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
  ];

  // Icons for different designs
  const designIcons = [FiStar, FiZap, FiTarget, FiAward, FiTrendingUp, FiShield, FiClock, FiBook];

  return (
    <div className=" rounded-2xl border border-gray-700/40 px-4 sm:px-5 py-4 mb-7">
      {/* Subject Title Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-lg bg-purple-600/20 flex items-center justify-center">
            <FiBook className="w-3 h-3 text-purple-400" />
          </div>
         <div>
  <h2
    className="
      font-poppins font-bold 
      text-[14px] sm:text-[15px] md:text-[16px] 
      text-white
    "
  >
    {subject.name}
  </h2>

  <p
    className="
      text-gray-400 
      text-[10px] sm:text-[11px] md:text-[12px] 
      
    "
  >
    {totalCards} formula cards
  </p>
</div>

        </div>
      </div>

      {/* Recent Chapters Label */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-300 font-medium text-[11px] sm:text-[12px] md:text-[13px] ">Recent chapters</h3>
        {chapters.length > 0 && (
          <button
            onClick={() => router.push(`/formulacards/${subject.slug}`)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center space-x-1 transition-colors"
          >
            
            <FiArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chapter Cards Row */}
{chapters.length > 0 ? (
  <div className="flex space-x-4 overflow-x-auto  -mx-1 px-1 scrollbar-hide">
    {chapters.map((chapter, index) => {
      const DesignIcon = designIcons[index % designIcons.length];
      return (
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="
            flex-shrink-0 
            w-[115px] sm:w-[125px] lg:w-[135px] 
            cursor-pointer 
            group
          "
          onClick={() => router.push(`/formulacards/${subject.slug}/${chapter.slug}`)}
        >
          <div 
            className="
              aspect-[4/5] 
              rounded-lg 
              p-2.5 
              flex flex-col justify-between 
              relative overflow-hidden
            "
            style={{
              background: cardGradients[index % cardGradients.length],
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
            }}
          >
            {/* Unique Thumbnail Design */}
            <ThumbnailDesign designIndex={index} />

            {/* Design Icon */}
            <div className="absolute top-2 right-2 z-10">
              <DesignIcon className="w-3.5 h-3.5 text-white/80" />
            </div>

            {/* Chapter Name */}
            <h3 className="text-white font-semibold text-[13px] leading-tight relative z-10">
              {chapter.name}
            </h3>

            {/* Bottom Section */}
            <div className="flex items-center justify-between relative z-10 mt-1.5">
              
              {/* Card Count */}
              <div className="flex items-center space-x-1">
                <FiFileText className="w-3 h-3 text-white/90" />
                <span className="text-white/90 font-medium text-[12px]">
                  {chapter.card_count}
                </span>
              </div>

              {/* Go Button */}
              <div className="
                w-7 h-7 
                bg-white 
                rounded-full 
                flex items-center justify-center 
                shadow-md 
                group-hover:scale-110 
                transition-transform 
                duration-200
              ">
                <FiArrowRight className="w-3.5 h-3.5 text-gray-700" />
              </div>
            </div>

          </div>
        </motion.div>
      );
    })}
  </div>

      ) : (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiBook className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-400 text-sm">No chapters available yet</p>
        </div>
      )}
    </div>
  );
};

// Main Page Component
export default function FormulaCardsHomePage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all subjects with their chapters and card counts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all subjects ordered by order
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .order('order');

        if (subjectsError) throw subjectsError;

        // For each subject, fetch recent chapters and calculate total cards
        const subjectsWithData = await Promise.all(
          (subjectsData || []).map(async (subject) => {
            // Fetch up to 5 recent chapters for this subject
            const { data: chaptersData, error: chaptersError } = await supabase
              .from('chapters')
              .select('*')
              .eq('subject_id', subject.id)
              .order('order')
              .limit(5);

            if (chaptersError) throw chaptersError;

            // For each chapter, count the number of formula cards
            const chaptersWithCounts = await Promise.all(
              (chaptersData || []).map(async (chapter) => {
                const { count, error: countError } = await supabase
                  .from('formula_cards')
                  .select('*', { count: 'exact', head: true })
                  .eq('chapter_id', chapter.id);

                if (countError) throw countError;

                return {
                  ...chapter,
                  card_count: count || 0
                };
              })
            );

            // Calculate total cards for this subject
            let totalCardCount = 0;
            for (const chapter of chaptersWithCounts) {
              const { count, error: totalCountError } = await supabase
                .from('formula_cards')
                .select('*', { count: 'exact', head: true })
                .eq('chapter_id', chapter.id);

              if (!totalCountError) {
                totalCardCount += count || 0;
              }
            }

            return {
              ...subject,
              chapters: chaptersWithCounts,
              totalCards: totalCardCount
            };
          })
        );

        setSubjects(subjectsWithData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Formula Cards | Study Platform</title>
        <meta name="description" content="Browse all formula cards by subject" />
      </Head>

      <div className="min-h-screen bg-slate-900">
        {/* Page Header */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
          {/* Back Button and Title */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={() => router.back()}
              className="w-7 h-7 rounded-full bg-gray-800/60 border border-gray-700/40 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white font-poppins">
                Formula Cards
              </h1>
              <p className="text-gray-400 mt-1">
                Master your formulas with interactive flashcards
              </p>
            </div>
          </div>

          {/* Subjects Grid */}
          <div className="space-y-7">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <SubjectBlock
                  subject={subject}
                  chapters={subject.chapters}
                  totalCards={subject.totalCards}
                />
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {subjects.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-800/40 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-700/40">
                <FiBook className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No Subjects Available
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                Formula cards will be available soon. Check back later to start learning.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Server-side data fetching for better SEO
export async function getServerSideProps() {
  return {
    props: {},
  };
}