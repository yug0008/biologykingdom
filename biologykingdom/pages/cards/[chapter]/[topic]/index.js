import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiArrowRight, 
  FiBookmark, 
  FiThumbsUp, 
  FiThumbsDown,
  FiChevronLeft,
  FiStar
} from 'react-icons/fi';
import { supabase } from '../../../../lib/supabase';

// Progress Bar Component (Instagram-style)
const ProgressBar = ({ currentIndex, totalCards, onCardClick }) => {
  return (
    <div className="flex space-x-1 mb-4 px-2">
      {Array.from({ length: totalCards }).map((_, index) => (
        <button
          key={index}
          onClick={() => onCardClick(index)}
          className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden transition-all duration-200 hover:bg-gray-500"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              index <= currentIndex ? 'bg-white' : 'bg-transparent'
            } ${index === currentIndex ? 'animate-pulse' : ''}`}
            style={{
              width: index <= currentIndex ? '100%' : '0%',
            }}
          />
        </button>
      ))}
    </div>
  );
};

// Flashcard Component with click navigation
const Flashcard = ({ card, userProgress, onBookmark, onLike, onDislike, onNext, onPrevious }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageClick = (e) => {
    const cardWidth = e.currentTarget.offsetWidth;
    const clickX = e.nativeEvent.offsetX;
    
    // If click on right 40% of image, go to next card
    if (clickX > cardWidth * 0.6) {
      onNext();
    }
    // If click on left 40% of image, go to previous card
    else if (clickX < cardWidth * 0.4) {
      onPrevious();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-[520px] mx-auto"
    >
      {/* Image Container with Click Navigation */}
      <div className="relative bg-gray-50 cursor-pointer" onClick={handleImageClick}>
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        )}
        <img
          src={card.image_url}
          alt={card.title}
          className={`w-full h-auto object-contain transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        
        {/* Click Hints (visible on hover) */}
        <div className="absolute inset-0 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-black/20 text-white p-2 rounded-full m-4">
            <FiArrowLeft className="w-6 h-6" />
          </div>
          <div className="bg-black/20 text-white p-2 rounded-full m-4">
            <FiArrowRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-6">
          {/* Dislike Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDislike}
            className={`p-3 rounded-full transition-colors ${
              userProgress?.status === 'need_revision' 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <FiThumbsDown className="w-6 h-6" />
          </motion.button>

          {/* Bookmark Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBookmark}
            className={`p-3 rounded-full transition-colors relative ${
              userProgress?.is_bookmarked 
                ? 'bg-purple-100 text-purple-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-500'
            }`}
          >
            <FiBookmark className="w-6 h-6" />
            {userProgress?.is_bookmarked && (
              <FiStar className="w-3 h-3 absolute -top-1 -right-1 text-purple-600 fill-current" />
            )}
          </motion.button>

          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onLike}
            className={`p-3 rounded-full transition-colors ${
              userProgress?.status === 'memorized' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-500'
            }`}
          >
            <FiThumbsUp className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Navigation Arrows
const NavigationArrows = ({ onPrevious, onNext, hasPrevious, hasNext }) => (
  <>
    {/* Previous Arrow */}
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onPrevious}
      disabled={!hasPrevious}
      className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full backdrop-blur-sm border border-gray-600 transition-all ${
        hasPrevious 
          ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer' 
          : 'bg-white/5 text-gray-500 cursor-not-allowed'
      }`}
    >
      <FiArrowLeft className="w-6 h-6" />
    </motion.button>

    {/* Next Arrow */}
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onNext}
      disabled={!hasNext}
      className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full backdrop-blur-sm border border-gray-600 transition-all ${
        hasNext 
          ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer' 
          : 'bg-white/5 text-gray-500 cursor-not-allowed'
      }`}
    >
      <FiArrowRight className="w-6 h-6" />
    </motion.button>
  </>
);

// Progress Stats Component
const ProgressStats = ({ currentIndex, totalCards, userProgress }) => (
  <div className="flex items-center justify-center space-x-4 
                  text-[10px] sm:text-sm text-gray-400 mt-4">

    <span>
      {currentIndex + 1} of {totalCards}
    </span>

    <span>•</span>

    <span className="capitalize">
      Status: {userProgress?.status || 'new'}
    </span>

    <span>•</span>

    <span>
      Reviewed: {userProgress?.review_count || 0} time
      {(userProgress?.review_count || 0) !== 1 ? 's' : ''}
    </span>

  </div>
);


// Main Page Component
export default function FlashcardViewerPage({ initialData }) {
  const router = useRouter();
  const { chapter, topic, card: cardParam } = router.query;
  
  const [cards, setCards] = useState(initialData.cards || []);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userProgress, setUserProgress] = useState({});
  const [chapterData, setChapterData] = useState(initialData.chapter || null);
  const [topicData, setTopicData] = useState(initialData.topic || null);
  const [loading, setLoading] = useState(false);
  
  // Swipe gesture tracking
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const cardRef = useRef(null);

  const currentCard = cards[currentCardIndex];
  const currentProgress = userProgress[currentCard?.id];

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Initialize current card index from URL parameter
  useEffect(() => {
    if (cardParam && cards.length > 0) {
      const cardIndex = cards.findIndex(card => card.id === cardParam);
      if (cardIndex !== -1) {
        setCurrentCardIndex(cardIndex);
      }
    }
  }, [cardParam, cards]);

  // Track card view and update progress
  useEffect(() => {
    if (currentCard) {
      trackCardView(currentCard.id);
    }
  }, [currentCard]);

  // Update URL when card changes
  useEffect(() => {
    if (currentCard && cards.length > 0) {
      const newUrl = `/formulacards/${chapter}/${topic}?card=${currentCard.id}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentCardIndex, chapter, topic, currentCard]);

  // Swipe gesture handlers
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasNext) {
      goToNext();
    } else if (isRightSwipe && hasPrevious) {
      goToPrevious();
    }
  };

  // Navigation handlers
  const goToPrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const goToCard = (index) => {
    if (index >= 0 && index < cards.length) {
      setCurrentCardIndex(index);
    }
  };

  const hasPrevious = currentCardIndex > 0;
  const hasNext = currentCardIndex < cards.length - 1;

  // Track card view in database
  const trackCardView = async (cardId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current progress or create default
      const { data: existingProgress } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('flashcard_id', cardId)
        .single();

      const updates = {
        user_id: user.id,
        flashcard_id: cardId,
        last_viewed_at: new Date().toISOString(),
        review_count: (existingProgress?.review_count || 0) + 1,
        status: existingProgress?.status || (existingProgress ? 'learning' : 'new'),
        updated_at: new Date().toISOString()
      };

      if (existingProgress) {
        // Update existing progress
        const { data } = await supabase
          .from('user_flashcard_progress')
          .update(updates)
          .eq('id', existingProgress.id)
          .select()
          .single();

        if (data) {
          setUserProgress(prev => ({
            ...prev,
            [cardId]: data
          }));
        }
      } else {
        // Create new progress record
        const { data } = await supabase
          .from('user_flashcard_progress')
          .insert([{ ...updates, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (data) {
          setUserProgress(prev => ({
            ...prev,
            [cardId]: data
          }));
        }
      }
    } catch (error) {
      console.error('Error tracking card view:', error);
    }
  };

  // Action handlers
  const handleBookmark = async () => {
    if (!currentCard) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newBookmarkState = !currentProgress?.is_bookmarked;
      
      const updates = {
        user_id: user.id,
        flashcard_id: currentCard.id,
        is_bookmarked: newBookmarkState,
        updated_at: new Date().toISOString()
      };

      if (currentProgress) {
        const { data } = await supabase
          .from('user_flashcard_progress')
          .update(updates)
          .eq('id', currentProgress.id)
          .select()
          .single();

        if (data) {
          setUserProgress(prev => ({
            ...prev,
            [currentCard.id]: data
          }));
        }
      } else {
        const { data } = await supabase
          .from('user_flashcard_progress')
          .insert([{
            ...updates,
            status: 'new',
            review_count: 1,
            created_at: new Date().toISOString(),
            last_viewed_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (data) {
          setUserProgress(prev => ({
            ...prev,
            [currentCard.id]: data
          }));
        }
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const handleLike = async () => {
    await updateCardStatus('memorized');
  };

  const handleDislike = async () => {
    await updateCardStatus('need_revision');
  };

  const updateCardStatus = async (status) => {
    if (!currentCard) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        user_id: user.id,
        flashcard_id: currentCard.id,
        status: status,
        updated_at: new Date().toISOString()
      };

      if (currentProgress) {
        const { data } = await supabase
          .from('user_flashcard_progress')
          .update(updates)
          .eq('id', currentProgress.id)
          .select()
          .single();

        if (data) {
          setUserProgress(prev => ({
            ...prev,
            [currentCard.id]: data
          }));
        }
      } else {
        const { data } = await supabase
          .from('user_flashcard_progress')
          .insert([{
            ...updates,
            is_bookmarked: false,
            review_count: 1,
            created_at: new Date().toISOString(),
            last_viewed_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (data) {
          setUserProgress(prev => ({
            ...prev,
            [currentCard.id]: data
          }));
        }
      }
    } catch (error) {
      console.error('Error updating card status:', error);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        handleBookmark();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentCardIndex, cards.length, hasPrevious, hasNext]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">No Flashcards Found</h1>
          <p className="text-gray-300 mb-4">No formula cards available for this topic.</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
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
        <title>{currentCard?.title} | {topicData?.name} | {chapterData?.name} | Formula Cards</title>
        <meta name="description" content={`Flashcard for ${currentCard?.title}`} />
      </Head>

      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 border-b border-slate-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {/* Progress Bar */}
            <ProgressBar 
              currentIndex={currentCardIndex}
              totalCards={cards.length}
              onCardClick={goToCard}
            />
            
            <div className="flex items-center justify-between">
              {/* Breadcrumb and Title */}
              <div className="flex-1 min-w-0">
                <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
                  <button 
                    onClick={() => router.push(`/formulacards/${chapter}`)}
                    className="hover:text-white transition-colors"
                  >
                    {chapterData?.name}
                  </button>
                  <span>•</span>
                  <span>{topicData?.name}</span>
                </nav>
                <h1 className="text-xl font-bold text-white font-poppins truncate">
                  {currentCard?.title}
                </h1>
              </div>

              {/* Bookmark Button in Header */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBookmark}
                className={`p-3 rounded-full transition-colors ${
                  currentProgress?.is_bookmarked 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600 hover:text-white'
                }`}
              >
                <FiBookmark className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 relative">
          <NavigationArrows
            onPrevious={goToPrevious}
            onNext={goToNext}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
          />

          <div 
            ref={cardRef}
            className="w-full max-w-[480px] lg:max-w-[520px]"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <AnimatePresence mode="wait">
              {currentCard && (
                <Flashcard
                  key={currentCard.id}
                  card={currentCard}
                  userProgress={currentProgress}
                  onBookmark={handleBookmark}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onNext={goToNext}
                  onPrevious={goToPrevious}
                />
              )}
            </AnimatePresence>

            {/* Progress Stats */}
            <ProgressStats
              currentIndex={currentCardIndex}
              totalCards={cards.length}
              userProgress={currentProgress}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// Server-side data fetching (unchanged)
export async function getServerSideProps(context) {
  const { chapter, topic } = context.params;
  const { card: cardParam } = context.query;

  try {
    // Fetch chapter data
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('slug', chapter)
      .single();

    if (chapterError) throw chapterError;

    // Fetch topic data
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('slug', topic)
      .eq('chapter_id', chapterData.id)
      .single();

    if (topicError) throw topicError;

    // Fetch formula cards for this topic
    const { data: cards, error: cardsError } = await supabase
      .from('formula_cards')
      .select('*')
      .eq('topic_id', topicData.id)
      .order('order', { ascending: true });

    if (cardsError) throw cardsError;

    // Fetch user progress if user is authenticated
    let userProgress = {};
    const { data: { user } } = await supabase.auth.getUser();

    if (user && cards && cards.length > 0) {
      const cardIds = cards.map(card => card.id);
      const { data: progressData, error: progressError } = await supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('flashcard_id', cardIds);

      if (!progressError && progressData) {
        progressData.forEach(progress => {
          userProgress[progress.flashcard_id] = progress;
        });
      }
    }

    return {
      props: {
        initialData: {
          chapter: chapterData,
          topic: topicData,
          cards: cards || [],
          userProgress
        }
      }
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    return {
      props: {
        initialData: {
          chapter: null,
          topic: null,
          cards: [],
          userProgress: {}
        }
      }
    };
  }
}