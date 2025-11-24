import { useState } from 'react';
import { 
  FiHome, 
  FiBook, 
  FiUsers, 
  FiBarChart2, 
  FiFileText, 
  FiUser,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import { useRouter } from 'next/router';

const Sidebar = ({ isOpen, onClose }) => {
  const [activeItem, setActiveItem] = useState('home');
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const router = useRouter();

  const menuItems = [
    {
      name: 'Home',
      icon: FiHome,
      path: '/',
      key: 'home'
    },
    {
      name: 'Practice PYQ',
      icon: FiBook,
      key: 'pyq',
      submenu: [
        { name: 'NEET PYQ', path: '/pyq/neet' },
        { name: 'AIIMS PYQ', path: '/pyq/aiims' },
        { name: 'JIPMER PYQ', path: '/pyq/jipmer' },
        { name: 'State PMT PYQ', path: '/pyq/state-pmt' }
      ]
    },
    {
      name: 'Courses',
      icon: FiBook,
      key: 'courses',
      submenu: [
        { name: 'NEET Crash Course', path: '/courses/neet-crash' },
        { name: 'Foundation Course', path: '/courses/foundation' },
        { name: 'Revision Course', path: '/courses/revision' },
        { name: 'Advanced Course', path: '/courses/advanced' },
        { name: 'Dropper Batch', path: '/courses/dropper' }
      ]
    },
    {
      name: 'Mentorship',
      icon: FiUsers,
      path: '/mentorship',
      key: 'mentorship'
    },
    {
      name: 'Tests',
      icon: FiBarChart2,
      key: 'tests',
      submenu: [
        { name: 'Full Tests', path: '/tests/full' },
        { name: 'Chapter Tests', path: '/tests/chapter' },
        { name: 'Subject Tests', path: '/tests/subject' },
        { name: 'Previous Tests', path: '/tests/previous' },
        { name: 'Mock Tests', path: '/tests/mock' },
        { name: 'Speed Tests', path: '/tests/speed' }
      ]
    },
    {
      name: 'DPP',
      icon: FiFileText,
      key: 'dpp',
      submenu: [
        { name: 'Physics DPP', path: '/dpp/physics' },
        { name: 'Chemistry DPP', path: '/dpp/chemistry' },
        { name: 'Biology DPP', path: '/dpp/biology' },
        { name: 'Botany DPP', path: '/dpp/botany' },
        { name: 'Zoology DPP', path: '/dpp/zoology' }
      ]
    },
    {
      name: 'Study Material',
      icon: FiBook,
      key: 'material',
      submenu: [
        { name: 'Notes', path: '/material/notes' },
        { name: 'Formulas', path: '/material/formulas' },
        { name: 'Diagrams', path: '/material/diagrams' },
        { name: 'Mnemonics', path: '/material/mnemonics' }
      ]
    },
    {
      name: 'Analysis',
      icon: FiBarChart2,
      key: 'analysis',
      submenu: [
        { name: 'Performance', path: '/analysis/performance' },
        { name: 'Weak Areas', path: '/analysis/weak-areas' },
        { name: 'Ranking', path: '/analysis/ranking' }
      ]
    },
    {
      name: 'Profile',
      icon: FiUser,
      path: '/profile',
      key: 'profile'
    },
    {
      name: 'Settings',
      icon: FiUser,
      path: '/settings',
      key: 'settings'
    }
  ];

  const handleItemClick = (item) => {
    setActiveItem(item.key);
    if (item.path) {
      router.push(item.path);
      onClose();
    }
    if (item.submenu) {
      setOpenSubmenu(openSubmenu === item.key ? null : item.key);
    }
  };

  const handleSubItemClick = (path) => {
    router.push(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        w-64 bg-gray-900 border-r border-gray-700
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
       {/* Logo for Sidebar */}
<div className="flex-shrink-0 flex items-center justify-center h-20 border-b border-gray-700 px-4">
  <img 
    src="/logobk.webp" 
    alt="BiologyKingdom Logo" 
    className="w-[125px] h-[75px] object-contain"
  />
</div>


        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto">
          <nav className="mt-8 px-4 pb-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.key}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg
                      transition-all duration-200 group
                      ${activeItem === item.key 
                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon 
                        size={20} 
                        className={activeItem === item.key ? 'text-white' : 'text-gray-400 group-hover:text-white'} 
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    
                    {item.submenu && (
                      openSubmenu === item.key ? 
                      <FiChevronDown size={16} /> : 
                      <FiChevronRight size={16} />
                    )}
                  </button>

                  {/* Submenu */}
                  {item.submenu && openSubmenu === item.key && (
                    <ul className="mt-2 ml-4 space-y-1 border-l border-gray-700 pl-4">
                      {item.submenu.map((subItem, index) => (
                        <li key={index}>
                          <button
                            onClick={() => handleSubItemClick(subItem.path)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors duration-200"
                          >
                            {subItem.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Fixed Progress Section at Bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Today's Progress</span>
              <span className="text-sm text-green-400">60%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{ width: '60%' }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Complete your daily goals</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;