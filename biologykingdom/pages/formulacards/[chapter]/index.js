import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '../../../components/sidebar';
import { motion } from 'framer-motion';
import { 
  FiList, 
  FiThumbsDown, 
  FiBookmark, 
  FiEyeOff, 
  FiThumbsUp,
  FiArrowLeft
} from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';

// Stats Cards Component
const StatsCards = ({ stats, chapterName, totalCards }) => {
  const statItems = [
    {
      id: 'all',
      title: 'All Formulae',
      count: totalCards,
      color: '#6A8DFF',
      icon: FiList,
      gradient: 'radial-gradient(circle at top, #6A8DFF 0%, #4A6BE5 100%)'
    },
    {
      id: 'need_revision',
      title: 'Need Revision',
      count: stats.need_revision || 0,
      color: '#E84949',
      icon: FiThumbsDown,
      gradient: 'radial-gradient(circle at top, #E84949 0%, #C62828 100%)'
    },
    {
      id: 'bookmarked',
      title: 'Bookmarks',
      count: stats.bookmarked || 0,
      color: '#6A5BFF',
      icon: FiBookmark,
      gradient: 'radial-gradient(circle at top, #6A5BFF 0%, #5B4BCC 100%)'
    },
    {
      id: 'new',
      title: 'Not Seen',
      count: stats.not_seen || 0,
      color: '#F2C14E',
      icon: FiEyeOff,
      gradient: 'radial-gradient(circle at top, #F2C14E 0%, #D4AC0D 100%)'
    },
    {
      id: 'memorized',
      title: 'Memorized',
      count: stats.memorized || 0,
      color: '#4CAF50',
      icon: FiThumbsUp,
      gradient: 'radial-gradient(circle at top, #4CAF50 0%, #388E3C 100%)'
    }
  ];

  return (
    <div className="bg-slate-900">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white font-poppins mb-2">
              {chapterName}
            </h1>
            <p className="text-gray-400 text-lg">
              {totalCards} Formula Cards
            </p>
          </div>
        </div>

{/* Stats Cards Grid */}
<div className="grid grid-cols-4 md:grid-cols-3 lg:grid-cols-8 gap-1 mb-1">
  {statItems.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.06 }}
      className="p-2 text-center"
    >
      {/* Icon Circle */}
      <div
        className="w-9 h-9 rounded-full mx-auto mb-1.5 flex items-center justify-center transition-all duration-200"
        style={{
          background: item.gradient,
          boxShadow: `0 3px 12px ${item.color}40`,
        }}
      >
        <item.icon className="w-4.5 h-4.5 text-white" />
      </div>

      {/* Title */}
      <h3 className="text-white font-medium text-[11px] sm:text-xs mb-0.5 font-poppins">
        {item.title}
      </h3>

      {/* Count */}
      <p className="text-gray-300 text-[10px] sm:text-[11px] leading-none">
        {item.count} Card{item.count !== 1 ? "s" : ""}
      </p>
    </motion.div>
  ))}
</div>

      </div>
    </div>
  );
};

// Topic Grid Component
const TopicGrid = ({ topics, chapter }) => {
  const router = useRouter();

  if (!topics || topics.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiList className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No Topics Available</h3>
        <p className="text-gray-400">No formula cards found for this chapter.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <h2 className="text-1xl font-bold text-white mb-8 font-poppins">All Topics</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {topics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push(`/formulacards/${chapter}/${topic.slug}`)}
            className="rounded-2xl overflow-hidden cursor-pointer group relative"
            style={{
              boxShadow: '0 10px 40px rgba(139, 92, 246, 0.15)'
            }}
          >
            {/* Image Container */}
            <div className="aspect-[4/5] relative overflow-hidden">
              {topic.preview_image ? (
                <img
                  src={topic.preview_image}
                  alt={topic.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <FiList className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Bottom Overlay Text */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-2">
                <h3 className="text-white font-semibold text-sm mb-0.5 truncate font-poppins">
                  {topic.name}
                </h3>
                <p className="text-gray-200 text-xs leading-none">
                  {topic.card_count} card{topic.card_count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};


// Main Page Component
export default function FormulaCardsChapterPage() {
  const router = useRouter();
  const { chapter } = router.query;
  
  const [chapterData, setChapterData] = useState(null);
  const [topics, setTopics] = useState([]);
  const [stats, setStats] = useState({});
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch chapter data and topics with formula cards
  useEffect(() => {
    if (!chapter) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch chapter data
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .select('*')
          .eq('slug', chapter)
          .single();

        if (chapterError) throw chapterError;
        setChapterData(chapterData);

        // Fetch topics for this chapter
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('*')
          .eq('chapter_id', chapterData.id)
          .order('order');

        if (topicsError) throw topicsError;

        // For each topic, get card count and preview image
        const topicsWithCards = await Promise.all(
          (topicsData || []).map(async (topic) => {
            // Get formula cards for this topic
            const { data: cards, error: cardsError } = await supabase
              .from('formula_cards')
              .select('*')
              .eq('topic_id', topic.id)
              .order('order');

            if (cardsError) throw cardsError;

            // Get preview image (first card ordered by 'order')
            const previewCard = cards && cards.length > 0 ? cards[0] : null;

            return {
              ...topic,
              card_count: cards ? cards.length : 0,
              preview_image: previewCard?.image_url || null
            };
          })
        );

        setTopics(topicsWithCards);

        // Calculate total cards
        const total = topicsWithCards.reduce((sum, topic) => sum + topic.card_count, 0);
        setTotalCards(total);

        // TODO: Fetch user progress stats when user system is implemented
        // For now, using placeholder stats
        setStats({
          need_revision: 0,
          bookmarked: 0,
          not_seen: total,
          memorized: 0
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chapter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
              

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Chapter Not Found</h1>
          <p className="text-gray-300">The requested chapter could not be found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

return (
    <>
      <Head>
        <title>{chapterData.name} Formula Cards | Study Platform</title>
        <meta name="description" content={`Formula cards for ${chapterData.name}`} />
      </Head>

      <div className="min-h-screen bg-slate-900">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Stats Section */}
        <StatsCards 
          stats={stats}
          chapterName={chapterData.name}
          totalCards={totalCards}
        />

        {/* Topics Grid Section */}
        <TopicGrid 
          topics={topics}
          chapter={chapter}
        />
      </div>
    </>
  );

}

// Server-side data fetching
export async function getServerSideProps(context) {
  const { chapter } = context.params;

  // You can add server-side data fetching here if needed
  // For now, we're using client-side fetching for real-time updates

  return {
    props: {
      // You can pass initial data here if using SSR
    },
  };
}