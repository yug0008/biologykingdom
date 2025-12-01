import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheck, 
  FiX, 
  FiCalendar,
  FiZap,
  FiShield,
  FiDownload,
  FiUsers,
  FiStar,
  FiArrowRight,
  FiLoader,
  FiLock,
  FiAward,
  FiTrendingUp,
  FiGlobe,
  FiSmartphone,
  FiClock,
  FiHeart,
  FiBookOpen,
  FiChevronRight
} from 'react-icons/fi';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';

// Components
const LoadingSkeleton = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <div className="max-w-6xl w-full">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-4 md:p-8 border border-slate-700/50">
        <div className="animate-pulse">
          <div className="h-8 md:h-10 bg-slate-700 rounded-lg w-3/4 md:w-1/4 mb-4 md:mb-6 mx-auto"></div>
          <div className="h-5 md:h-6 bg-slate-700 rounded-lg w-1/2 md:w-1/3 mb-6 md:mb-8 mx-auto"></div>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="md:col-span-2 space-y-3 md:space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 md:h-4 bg-slate-700 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="h-10 md:h-12 bg-slate-700 rounded-xl"></div>
              <div className="h-20 md:h-24 bg-slate-700 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Mobile Sticky Button Component
const MobileStickyButton = ({ plan, isSubscribed, isLoading, isRazorpayLoading, onSubscribe }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent"
    >
      <button
        onClick={onSubscribe}
        disabled={isSubscribed || isLoading || isRazorpayLoading}
        className={`
          w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-300
          flex items-center justify-center space-x-3 relative overflow-hidden group
          ${isSubscribed 
            ? 'bg-slate-800/90 text-slate-400 cursor-not-allowed border border-slate-700/50 backdrop-blur-sm' 
            : 'bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-500 hover:to-sky-600 text-white shadow-2xl shadow-emerald-500/25 hover:shadow-3xl hover:shadow-emerald-500/40 transform hover:scale-[1.02] active:scale-[0.98]'
          }
          ${(isLoading || isRazorpayLoading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        
        {isLoading || isRazorpayLoading ? (
          <>
            <FiLoader className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : isSubscribed ? (
          <>
            <FiCheck className="w-5 h-5" />
            <span>Active Subscription</span>
          </>
        ) : (
          <>
            <FiLock className="w-5 h-5" />
            <span>Get Premium Access</span>
            <FiChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </motion.div>
  );
};

const PlanHeader = ({ plan, isSubscribed, onSubscribe, isLoading, isRazorpayLoading }) => (
  <div className="text-center mb-6 md:mb-8 relative">
    {/* Desktop Subscribe Button */}
    <div className="hidden md:block absolute top-0 right-0">
      <button
        onClick={onSubscribe}
        disabled={isSubscribed || isLoading || isRazorpayLoading}
        className={`
          px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300
          flex items-center space-x-2 relative overflow-hidden group
          ${isSubscribed 
            ? 'bg-slate-800/40 text-slate-400 cursor-not-allowed border border-slate-700/50' 
            : 'bg-gradient-to-r from-emerald-600 to-sky-700 hover:from-emerald-500 hover:to-sky-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30'
          }
          ${(isLoading || isRazorpayLoading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading || isRazorpayLoading ? (
          <FiLoader className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <>
            <FiCheck className="w-4 h-4" />
            <span>Active</span>
          </>
        ) : (
          <>
            <FiLock className="w-4 h-4" />
            <span>Get Access</span>
          </>
        )}
      </button>
    </div>
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600/20 to-sky-700/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-4 backdrop-blur-sm"
    >
      <FiAward className="w-3 h-3 mr-1.5" />
      PREMIUM PLAN
    </motion.div>
    
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-emerald-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent mb-3"
    >
      {plan?.name || 'Loading...'}
    </motion.h1>
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center space-y-2"
    >
      <div className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 backdrop-blur-sm">
        <span className="text-2xl md:text-4xl font-bold text-white">
          ₹{(plan?.price_in_paise / 100) || 0}
        </span>
        {plan?.billing_interval === 'monthly' && (
          <span className="text-slate-300 text-sm md:text-base ml-1.5">/month</span>
        )}
        {plan?.billing_interval === 'yearly' && (
          <span className="text-slate-300 text-sm md:text-base ml-1.5">/year</span>
        )}
        {plan?.billing_interval === 'once' && (
          <span className="text-emerald-300 text-sm md:text-base ml-1.5">one-time</span>
        )}
      </div>
      
      {isSubscribed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-600/20 to-emerald-700/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-sm"
        >
          <FiCheck className="w-3 h-3 mr-1.5" />
          Active Subscription
        </motion.div>
      )}
    </motion.div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, index, isLast }) => (
  <>
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + (index * 0.05) }}
      className="group"
    >
      <div className="flex items-start space-x-3 md:space-x-4 p-3 md:p-0">
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-600/20 to-sky-700/20 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm md:text-base font-semibold text-white mb-1 truncate">{title}</h4>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed line-clamp-2">{description}</p>
        </div>
      </div>
    </motion.div>
    {!isLast && (
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2 md:my-3"></div>
    )}
  </>
);

const FeatureList = ({ features }) => (
  <div className="mb-4 md:mb-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex items-center mb-4 md:mb-5"
    >
      <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-emerald-600/20 to-sky-700/20 flex items-center justify-center mr-2 md:mr-3">
        <FiStar className="w-3 h-3 md:w-4 md:h-4 text-emerald-300" />
      </div>
      <h3 className="text-lg md:text-2xl font-bold text-white">Everything You Get</h3>
    </motion.div>
    
    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl md:rounded-2xl border border-slate-700/50 p-3 md:p-4 md:p-5">
      <div className="space-y-1 md:space-y-0">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            {...feature}
            index={index}
            isLast={index === features.length - 1}
          />
        ))}
      </div>
    </div>
  </div>
);

const ValidityBlock = ({ plan, subscription }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.6 }}
    className="relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-4 md:p-5 mb-4 md:mb-6 backdrop-blur-sm"
  >
    <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-emerald-600/20 to-sky-700/20 flex items-center justify-center flex-shrink-0">
        <FiCalendar className="w-4 h-4 md:w-5 md:h-5 text-emerald-300" />
      </div>
      <h4 className="text-base md:text-lg font-semibold text-white">Subscription Details</h4>
    </div>
    
    {subscription ? (
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <div className="bg-slate-800/40 rounded-lg md:rounded-xl p-2.5 md:p-3 border border-slate-700/30">
          <p className="text-xs md:text-sm text-slate-400 mb-1">Status</p>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></div>
            <p className="text-emerald-300 text-sm md:text-base font-semibold">Active</p>
          </div>
        </div>
        <div className="bg-slate-800/40 rounded-lg md:rounded-xl p-2.5 md:p-3 border border-slate-700/30">
          <p className="text-xs md:text-sm text-slate-400 mb-1">Expires</p>
          <p className="text-white text-sm md:text-base font-semibold">
            {new Date(subscription.expires_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
        <div className="bg-slate-800/40 rounded-lg md:rounded-xl p-2.5 md:p-3 border border-slate-700/30">
          <p className="text-xs md:text-sm text-slate-400 mb-1">Duration</p>
          <p className="text-white text-sm md:text-base font-semibold">
            {plan?.duration_days ? `${plan.duration_days} days` : 'Lifetime'}
          </p>
        </div>
        <div className="bg-slate-800/40 rounded-lg md:rounded-xl p-2.5 md:p-3 border border-slate-700/30">
          <p className="text-xs md:text-sm text-slate-400 mb-1">Billing</p>
          <p className="text-emerald-300 text-sm md:text-base font-semibold capitalize">
            {plan?.billing_interval}
          </p>
        </div>
        <div className="col-span-2 md:col-span-1 bg-slate-800/40 rounded-lg md:rounded-xl p-2.5 md:p-3 border border-slate-700/30">
          <p className="text-xs md:text-sm text-slate-400 mb-1">Support</p>
          <p className="text-white text-sm md:text-base font-semibold">Priority</p>
        </div>
      </div>
    )}
  </motion.div>
);

// Custom Hook for Subscription Logic (keep existing)
const useSubscription = (planSlug) => {
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !planSlug) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('*')
          .eq('slug', planSlug)
          .eq('active', true)
          .single();

        if (planError) throw planError;
        setPlan(planData);

        const { data: subscriptionData, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', planData.id)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString())
          .single();

        if (!subError && subscriptionData) {
          setSubscription(subscriptionData);
        }

      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, planSlug]);

  return { plan, subscription, loading, error };
};

// Custom Hook for Razorpay (keep existing)
const useRazorpay = () => {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpay();
  }, []);

  const createOrder = async (planId, amount) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan_id: planId,
          amount: amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      const data = await response.json();
      return data.orderId;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const openRazorpay = async (orderId, plan, onSuccess, onError) => {
    if (!window.Razorpay) {
      onError('Payment service not available');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email || '';

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: plan.price_in_paise,
      currency: 'INR',
      name: 'BiologyKingdom',
      description: plan.name,
      order_id: orderId,
      handler: async function (response) {
        try {
          setLoading(true);
          await verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: plan.id,
          });
          onSuccess();
        } catch (error) {
          onError(error.message);
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: user?.user_metadata?.full_name || 'User',
        email: userEmail,
        contact: user?.user_metadata?.phone || ''
      },
      theme: {
        color: '#10b981',
        backdrop_color: '#0f172a'
      },
      modal: {
        ondismiss: function() {
          setLoading(false);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  return {
    razorpayLoaded,
    loading,
    createOrder,
    openRazorpay,
  };
};

// Main Page Component
export default function SubscriptionPlanPage() {
  const router = useRouter();
  const { plan: planSlug } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { plan, subscription, loading: dataLoading, error } = useSubscription(planSlug);
  const { razorpayLoaded, loading: razorpayLoading, createOrder, openRazorpay } = useRazorpay();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const mainContentRef = useRef(null);

  const features = [
    {
      icon: FiBookOpen,
      title: "Topic-wise PYQs",
      description: "Complete previous year questions organized by topic"
    },
    {
      icon: FiTrendingUp,
      title: "Chapter-wise Practice",
      description: "Structured practice sets for every chapter"
    },
    {
      icon: FiZap,
      title: "Smart Flashcards",
      description: "AI-powered formula cards for maximum retention"
    },
    {
      icon: FiGlobe,
      title: "Multi-Device Access",
      description: "Access on desktop, tablet, and mobile"
    },
    {
      icon: FiDownload,
      title: "Offline Downloads",
      description: "Download PYQs and cards for offline studying"
    },
    {
      icon: FiShield,
      title: "Ad-Free Experience",
      description: "Zero distractions with clean interface"
    }
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleSubscribe = async () => {
    if (!plan || subscription) return;

    try {
      setIsProcessing(true);
      setPaymentError(null);

      const orderId = await createOrder(plan.id, plan.price_in_paise);
      
      await openRazorpay(
        orderId, 
        plan,
        () => {
          router.reload();
        },
        (error) => {
          setPaymentError(error);
        }
      );
    } catch (error) {
      setPaymentError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || dataLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-700/50"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-red-600/20 to-red-700/20 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <FiX className="w-8 h-8 md:w-10 md:h-10 text-red-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-2 md:mb-3">Plan Not Found</h2>
            <p className="text-slate-400 text-sm md:text-base text-center mb-6 md:mb-8">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 md:py-4 px-6 bg-gradient-to-r from-emerald-600 to-sky-700 text-white rounded-xl font-semibold hover:from-emerald-500 hover:to-sky-600 transition-all duration-300 shadow-lg shadow-emerald-500/25"
            >
              Back to Home
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return <LoadingSkeleton />;
  }

  const isSubscribed = !!subscription;

  return (
    <>
      <Head>
        <title>{plan.name} | Premium Access</title>
        <meta name="description" content={`Upgrade to ${plan.name} for exclusive features`} />
      </Head>

      <div className="min-h-screen bg-slate-900 overflow-hidden">
        {/* Animated background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-emerald-600/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-sky-600/10 rounded-full blur-3xl"></div>
        </div>

        <div 
          ref={mainContentRef}
          className="relative z-10 max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-6 md:py-8"
        >
          {/* Back button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center space-x-1.5 text-slate-400 hover:text-white transition-colors mb-4 md:mb-6 group"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center group-hover:border-emerald-500/30 transition-colors">
              <FiArrowRight className="w-3 h-3 md:w-4 md:h-4 rotate-180" />
            </div>
            <span className="text-xs md:text-sm font-medium">Back</span>
          </motion.button>

          {/* Header */}
          <PlanHeader 
            plan={plan} 
            isSubscribed={isSubscribed}
            onSubscribe={handleSubscribe}
            isLoading={isProcessing}
            isRazorpayLoading={!razorpayLoaded || razorpayLoading}
          />

          {/* Payment Error Alert */}
          <AnimatePresence>
            {paymentError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 md:mb-6"
              >
                <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-700/30 rounded-xl md:rounded-2xl p-4 backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-red-600/20 to-red-700/20 flex items-center justify-center flex-shrink-0">
                      <FiX className="w-4 h-4 md:w-5 md:h-5 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm md:text-base font-semibold text-white mb-0.5">Payment Failed</h4>
                      <p className="text-red-300 text-xs md:text-sm">{paymentError}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="space-y-4 md:space-y-6">
            {/* Features Section - Full width on both mobile & desktop */}
            <FeatureList features={features} />
            
            {/* Validity Section */}
            <ValidityBlock plan={plan} subscription={subscription} />

            {/* Stats Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl md:rounded-2xl border border-slate-700/50 p-4 md:p-5 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-rose-600/20 to-pink-700/20 flex items-center justify-center">
                  <FiHeart className="w-3 h-3 md:w-4 md:h-4 text-rose-400" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-white">Trusted by Students</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent mb-0.5">10k+</div>
                  <div className="text-xs md:text-sm text-slate-400">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent mb-0.5">98%</div>
                  <div className="text-xs md:text-sm text-slate-400">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent mb-0.5">24/7</div>
                  <div className="text-xs md:text-sm text-slate-400">Support</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent mb-0.5">4.9★</div>
                  <div className="text-xs md:text-sm text-slate-400">Rating</div>
                </div>
              </div>
            </motion.div>

            {/* Guarantee Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-emerald-900/10 to-sky-900/10 rounded-xl md:rounded-2xl border border-emerald-700/30 p-4 md:p-5 backdrop-blur-sm"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-br from-emerald-600/20 to-sky-700/20 flex items-center justify-center flex-shrink-0">
                  <FiShield className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white text-sm md:text-base font-semibold mb-0.5">Sahi practice hi sahi rank deti hai — aur woh yahin milegi.</p>
                  <p className="text-slate-400 text-xs md:text-sm">Practice Hard. Score Higher.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-6 md:mt-8 text-center"
          >
            <p className="text-xs md:text-sm text-slate-500">
              Need help choosing?{' '}
              <a href="mailto:support@biologykingdom.ac" className="text-emerald-400 hover:text-emerald-300 transition-colors underline">
                Contact our team
              </a>
            </p>
          </motion.div>
        </div>

        {/* Mobile Sticky Button */}
        <MobileStickyButton
          plan={plan}
          isSubscribed={isSubscribed}
          isLoading={isProcessing}
          isRazorpayLoading={!razorpayLoaded || razorpayLoading}
          onSubscribe={handleSubscribe}
        />
      </div>
    </>
  );
}