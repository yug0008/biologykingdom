// pages/index.js
import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Star, Users, CheckCircle, Quote, Video, BookOpen, Calendar, ShieldQuestion, PenTool, Layout } from 'lucide-react';

// Button Component
const Button = ({ children, variant = 'primary', className = '', icon, onClick, href }) => {
  const baseStyle = "px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-all duration-300 flex items-center gap-2 relative overflow-hidden group text-sm sm:text-base";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 border border-transparent",
    secondary: "bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-100 hover:border-blue-200",
    outline: "bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500/5",
    glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20",
    dark: "bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 shadow-lg",
  };

  const buttonContent = (
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {children}
        {icon}
      </span>
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </motion.span>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {buttonContent}
      </a>
    );
  }

  return (
    <button onClick={onClick} className="inline-block">
      {buttonContent}
    </button>
  );
};

// Subheader Component
const Subheader = () => {
  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-3">
          {/* Left Section */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              {/* NEET Logo */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src="https://pbs.twimg.com/profile_images/1689922352421998592/da1QWRF1_400x400.jpg" 
                  alt="NEET Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-white text-lg">NEET UG PYQ</h1>
                <p className="text-xs text-gray-300">Previous Year Questions</p>
              </div>
            </div>

            
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Total Questions */}
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-bold text-blue-400">24,874</div>
              <div className="text-xs text-gray-400">Total Questions</div>
            </div>

            {/* Start Practicing Button */}
            <Button 
              variant="primary" 
              icon={<ArrowRight size={16} />}
              href="/pyq/exams/neet"
              className="text-xs sm:text-sm"
            >
              Start Practicing
            </Button>
          </div>
        </div>

        {/* Mobile Total Questions */}
        <div className="sm:hidden text-center py-2 border-t border-slate-700">
          <div className="text-lg font-bold text-blue-400">24,874 Questions</div>
        </div>
      </div>
    </header>
  );
};

// Banner Section
const Banner = () => {
  return (
    <section className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="aspect-[3/1] w-full relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#ffffff_1px,_transparent_0)] bg-[length:40px_40px]" />
        </div>
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4 max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6"
            >
              Master <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">NEET UG</span> Preparation
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-sm sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Access 24,874+ previous year questions, detailed solutions, and AI-powered analytics to boost your NEET score.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              <Button variant="primary" icon={<Play size={18} />} className="text-sm sm:text-base">
                Watch Demo
              </Button>
              <Button variant="glass" icon={<ArrowRight size={18} />} className="text-sm sm:text-base">
                Explore Features
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Floating Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
          className="absolute top-1/4 left-1/4 w-4 h-4 bg-blue-400 rounded-full opacity-60"
        />
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 5, delay: 1 }}
          className="absolute top-3/4 right-1/3 w-3 h-3 bg-purple-400 rounded-full opacity-60"
        />
        <motion.div 
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 7, delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-blue-300 rounded-full opacity-40"
        />
      </div>
    </section>
  );
};

// Features Section with Dark Background
const Features = () => {
  const features = [
    { title: 'Live Classes', description: 'Real-time interactive learning with top educators.', icon: Video, color: 'text-red-400' },
    { title: 'Recorded Lessons', description: 'Access unlimited library of high-quality recordings.', icon: BookOpen, color: 'text-blue-400' },
    { title: 'Smart Planner', description: 'AI-driven study scheduler to keep you on track.', icon: Calendar, color: 'text-green-400' },
    { title: 'Instant Doubts', description: 'Get your questions answered instantly by experts.', icon: ShieldQuestion, color: 'text-purple-400' },
    { title: 'Mock Tests', description: 'Practice to perfection with detailed analysis.', icon: PenTool, color: 'text-orange-400' },
    { title: 'Revision Notes', description: 'Concise, high-impact notes for quick revision.', icon: Layout, color: 'text-teal-400' },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-900 to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-800 to-transparent z-10" />
      
      {/* Stars Background */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-['Inter']">
            Why Choose <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">BiologyKingdom</span>?
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-['Inter']">
            We provide a comprehensive ecosystem designed to maximize your learning potential 
            through cutting-edge technology and expert guidance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2 } 
              }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 border border-slate-700/50 group relative overflow-hidden"
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg ${feature.color} bg-opacity-50 group-hover:bg-opacity-70`}>
                  <feature.icon size={24} className={feature.color} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-['Inter'] group-hover:text-gray-100 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed font-['Inter'] group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Educators Section with Dark Background
const Educators = () => {
  const educators = [
  { 
    id: '1', 
    name: 'Dr. Yogesh Jindal', 
    subject: 'Biology', 
    students: '50k+', 
    courses: 12, 
    image: 'https://picsum.photos/seed/eleanor/200/200' 
  },
  { 
    id: '2', 
    name: 'Prof. Radhika Sharma', 
    subject: 'Physics', 
    students: '42k+', 
    courses: 8, 
    image: 'https://picsum.photos/seed/jamesk/200/200' 
  },
  { 
    id: '3', 
    name: 'Dr. Anil Verma', 
    subject: 'Mathematics', 
    students: '35k+', 
    courses: 15, 
    image: 'https://picsum.photos/seed/maria/200/200' 
  },
  { 
    id: '4', 
    name: 'Prof. Meera Nair', 
    subject: 'Chemistry', 
    students: '60k+', 
    courses: 20, 
    image: 'https://picsum.photos/seed/kenji/200/200' 
  },
];


  return (
    <section className="py-20 bg-gradient-to-b from-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#ffffff_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4"
        >
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-['Inter']">
              World-Class <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Educators</span>
            </h2>
            <p className="text-lg text-gray-300 max-w-xl font-['Inter']">
              Learn from industry experts and experienced educators who are passionate about your success.
            </p>
          </div>
          <Button variant="outline" className="whitespace-nowrap text-sm border-white text-white hover:bg-white/10">
            View All Mentors
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {educators.map((edu, index) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group text-center relative"
            >
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-4">
                {/* Gradient Background */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg scale-110" />
                
                {/* Image Container */}
                <div className="relative w-full h-full rounded-full p-1.5 bg-slate-700 border-2 border-slate-600 group-hover:border-transparent transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/25">
                  <img 
                    src={edu.image} 
                    alt={edu.name} 
                    className="w-full h-full rounded-full object-cover shadow-inner" 
                  />
                </div>
                
                {/* Course Badge */}
                <div className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full px-2 py-1 shadow-lg border border-slate-600">
                  <span className="text-xs font-bold text-white">{edu.courses} courses</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors font-['Inter']">
                {edu.name}
              </h3>
              <p className="text-gray-400 mb-3 text-sm font-['Inter']">{edu.subject}</p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 rounded-full text-xs font-semibold shadow-md border border-slate-600 group-hover:shadow-lg group-hover:border-blue-500/50 transition-all">
                <Users size={14} className="text-blue-400" />
                <span className="text-gray-300">{edu.students}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section with Dark Background
const Testimonials = () => {
  const testimonials = [
  {
    name: "Arjun Mehta",
    role: "JEE Aspirant",
    text: "BiologyKingdom ke lectures aur practice system ne meri preparation ka level hi change kar diya. 3D explanations ne Physics ko itna easy bana diya jitna kabhi socha nahi tha.",
    img: "https://picsum.photos/seed/alex/150/150"
  },
  {
    name: "Saniya Khan",
    role: "NEET Aspirant",
    text: "AI planner ne mujhe daily routine manage karne me bahut help ki. Pehle confusion hoti thi, ab har subject time pe complete hota hai. Biology diagrams yahan next-level hain!",
    img: "https://picsum.photos/seed/sarahlee/150/150"
  },
  {
    name: "Rohit Singh",
    role: "Railway Aspirant",
    text: "BiologyKingdom sirf padhai nahi, ek proper guidance system deta hai. Clean UI, smart tests, aur detailed analysis ne meri speed & accuracy dono improve ki.",
    img: "https://picsum.photos/seed/david/150/150"
  }
];


  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_#ffffff_1px,_transparent_0)] bg-[length:40px_40px]" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-['Inter']">
            Loved by <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Learners</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-xl mx-auto font-['Inter']">
            Join thousands of successful students who transformed their learning journey with BiologyKingdom
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              whileHover={{ y: -6 }}
              className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg shadow-slate-900/40 border border-slate-700/50 flex flex-col relative group hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 text-blue-400 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={48} />
              </div>
              
              <div className="mb-4 text-blue-400 opacity-80">
                <Quote size={24} />
              </div>
              
              <p className="text-gray-300 mb-6 flex-1 leading-relaxed font-['Inter'] group-hover:text-gray-200 transition-colors">
                "{t.text}"
              </p>
              
              <div className="flex items-center gap-3">
                <img 
                  src={t.img} 
                  alt={t.name} 
                  className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-slate-600 group-hover:border-blue-500/50 transition-colors" 
                />
                <div>
                  <h4 className="font-bold text-white font-['Inter']">{t.name}</h4>
                  <p className="text-gray-400 text-sm font-['Inter']">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main Home Component
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Subheader />
      <Banner />
      <Features />
      <Educators />
      <Testimonials />
    </div>
  );
}