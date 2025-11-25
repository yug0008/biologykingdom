import { useState } from 'react';
import Head from 'next/head';
import Header from './header';
import Sidebar from './sidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <Head>
        <title>BiologyKingdom - Medical Entrance Preparation</title>
        <meta name="description" content="Premium educational platform for medical entrance exams" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header 
              toggleSidebar={toggleSidebar} 
              isSidebarOpen={sidebarOpen} 
            />
            
            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-900">
              <div className="container mx-auto px-1 sm:px-2 lg:px-0 py-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;