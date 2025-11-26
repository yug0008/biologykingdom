import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSearch, FiBell, FiUser, FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleSignup = () => {
    router.push('/signup');
  };

  const handleProfile = () => {
    router.push('/profile');
    setIsProfileMenuOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setIsProfileMenuOpen(false);
    router.push('/');
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
  };

  const getUserDisplayName = () => {
    if (!userProfile) return 'User';
    return userProfile.name || user?.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (userProfile?.profile_pic_url) {
      return userProfile.profile_pic_url;
    }
    return null;
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 lg:hidden"
              >
                {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
              
              {/* Logo - Mobile Only */}
              <div className="flex items-center ml-2 lg:hidden">
                <div className="flex-shrink-0 flex items-center justify-center h-20 border-b border-gray-700 px-4">
                  <img 
  src="/logobk.webp" 
  alt="BiologyKingdom Logo" 
  className="w-[80px] h-[48px] xs:w-[90px] xs:h-[54px] sm:w-[100px] sm:h-[60px] object-contain
    invert brightness-[500%] contrast-[200%]"
/>


                </div>
              </div>
            </div>
            
            {/* Loading state for user section */}
            <div className="flex items-center space-x-2 xs:space-x-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left Section */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 lg:hidden"
            >
              {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            
            {/* Logo - Mobile Only */}
            <div className="flex items-center ml-2 lg:hidden">
              <div className="flex-shrink-0 flex items-center justify-center h-20 border-b border-gray-700 px-4">
                <img 
                  src="/logobk.webp" 
                  alt="BiologyKingdom Logo" 
                  className="w-[80px] h-[48px] xs:w-[90px] xs:h-[54px] sm:w-[100px] sm:h-[60px] object-contain"
                />
              </div>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search questions, topics, or courses..."
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2 xs:space-x-4">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 md:hidden"
            >
              <FiSearch size={20} />
            </button>

            {/* Notification */}
            <button className="relative p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800">
              <FiBell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {getUserAvatar() ? (
                    <img 
                      src={getUserAvatar()} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {getInitials(getUserDisplayName())}
                      </span>
                    </div>
                  )}
                  {/* Show name only on desktop */}
                  <span className="hidden sm:block text-sm font-medium">
                    {getUserDisplayName()}
                  </span>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-50">
                    <button
                      onClick={handleProfile}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <FiUser className="mr-3" size={16} />
                      My Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <FiLogOut className="mr-3" size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleLogin}
                  className="hidden sm:block px-3 xs:px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Login
                </button>
                <button 
                  onClick={handleSignup}
                  className="flex items-center space-x-2 px-3 xs:px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200"
                >
                  <FiUser size={16} />
                  <span className="hidden xs:inline">Sign Up</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="pb-4 md:hidden">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search questions, topics, or courses..."
                autoFocus
              />
            </div>
          </div>
        )}
      </div>

      {/* Overlay for dropdown */}
      {isProfileMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;