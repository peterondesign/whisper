'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon, 
  GlobeAltIcon, 
  ChatBubbleLeftIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

interface SidePanelProps {
  conversations?: Array<{
    id: string;
    timestamp: Date;
    userMessage: string;
    aiResponse: string;
  }>;
}

export default function SidePanel({ conversations = [] }: SidePanelProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Home',
      icon: HomeIcon,
      path: '/',
      description: 'Start new conversation'
    },
    {
      name: 'Memory Spots',
      icon: SparklesIcon,
      path: '/splatter',
      description: 'Explore conversations'
    },
    {
      name: 'History',
      icon: ChatBubbleLeftIcon,
      path: '/history',
      description: 'View all conversations'
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors md:hidden ${
          theme === 'light' 
            ? 'bg-white/90 hover:bg-white border border-gray-200 text-gray-700' 
            : 'bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-white'
        }`}
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </button>

      {/* Desktop Side Panel */}
      <div className={`fixed left-0 top-0 h-full w-64 z-40 hidden md:flex flex-col transition-colors duration-300 ${
        theme === 'light'
          ? 'bg-white/95 backdrop-blur-lg border-r border-gray-200'
          : 'bg-gray-900/95 backdrop-blur-lg border-r border-gray-700'
      }`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              theme === 'light' ? 'bg-blue-600' : 'bg-gray-800'
            }`}>
              <GlobeAltIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-lg font-semibold ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Splatter
            </h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                  pathname === item.path
                    ? theme === 'light'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-800 text-gray-200 border border-gray-700'
                    : theme === 'light'
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className={`text-xs ${
                    pathname === item.path
                      ? theme === 'light' ? 'text-blue-600' : 'text-gray-400'
                      : theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <div className="flex-1 p-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className={`text-sm font-medium mb-4 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Recent Conversations
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {conversations.slice(-5).reverse().map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    theme === 'light'
                      ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      : 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
                  }`}
                >
                  <p className={`text-xs truncate ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {conv.userMessage}
                  </p>
                  <p className={`text-xs mt-1 ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {conv.timestamp.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Theme Toggle */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Side Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* Mobile Panel */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={`fixed left-0 top-0 h-full w-80 z-50 flex flex-col md:hidden ${
                theme === 'light'
                  ? 'bg-white border-r border-gray-200'
                  : 'bg-gray-900 border-r border-gray-700'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      theme === 'light' ? 'bg-blue-600' : 'bg-gray-800'
                    }`}>
                      <GlobeAltIcon className="w-5 h-5 text-white" />
                    </div>
                    <h1 className={`text-lg font-semibold ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      Splatter
                    </h1>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-lg ${
                      theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-gray-800'
                    }`}
                  >
                    <XMarkIcon className={`w-5 h-5 ${
                      theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left ${
                        pathname === item.path
                          ? theme === 'light'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-800 text-gray-200 border border-gray-700'
                          : theme === 'light'
                            ? 'text-gray-700 hover:bg-gray-50'
                            : 'text-gray-300 hover:bg-gray-800/50'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className={`text-xs ${
                          pathname === item.path
                            ? theme === 'light' ? 'text-blue-600' : 'text-blue-400'
                            : theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Mobile Theme Toggle */}
              <div className="mt-auto p-6 border-t border-gray-200 dark:border-gray-700">
                <ThemeToggle />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
