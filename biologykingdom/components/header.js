import { useState } from 'react';
import { FiSearch, FiBell, FiUser, FiMenu, FiX } from 'react-icons/fi';
import Image from 'next/image';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
            {/* Mobile Search Icon - Hidden on smallest screens when logo is visible */}
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

            {/* Login/Profile */}
            {isLoggedIn ? (
              <button className="flex items-center space-x-2 p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">A</span>
                </div>
                <span className="hidden sm:block">Akshay</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsLoggedIn(true)}
                className="flex items-center space-x-2 px-3 xs:px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200"
              >
                <FiUser size={16} />
                <span className="hidden xs:inline">Login</span>
              </button>
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
    </header>
  );
};

export default Header;