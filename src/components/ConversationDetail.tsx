'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClockIcon, UserIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { Conversation } from './VoiceCompanion';

interface ConversationDetailProps {
  conversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConversationDetail({ 
  conversation, 
  isOpen, 
  onClose 
}: ConversationDetailProps) {
  const { theme } = useTheme();

  if (!conversation) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Detail Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed inset-4 md:inset-8 lg:inset-16 z-50 rounded-2xl shadow-2xl overflow-hidden ${
              theme === 'light'
                ? 'bg-white border border-gray-200'
                : 'bg-gray-900 border border-gray-700'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className={`p-6 border-b flex items-center justify-between ${
                theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-700 bg-gray-800'
              }`}>
                <div>
                  <h2 className={`text-xl font-semibold ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    Conversation Details
                  </h2>
                  <div className={`flex items-center gap-2 mt-1 text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    <ClockIcon className="w-4 h-4" />
                    {conversation.timestamp.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'hover:bg-gray-200 text-gray-500'
                      : 'hover:bg-gray-700 text-gray-400'
                  }`}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User Message */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-6 rounded-2xl ${
                    theme === 'light'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-blue-900/20 border border-blue-700/50'
                  }`}
                >
                  <div className={`flex items-center gap-3 mb-3 ${
                    theme === 'light' ? 'text-blue-700' : 'text-blue-300'
                  }`}>
                    <UserIcon className="w-5 h-5" />
                    <span className="font-medium">Your Message</span>
                  </div>
                  <p className={`text-lg leading-relaxed ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {conversation.userMessage}
                  </p>
                </motion.div>

                {/* AI Response */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`p-6 rounded-2xl ${
                    theme === 'light'
                      ? 'bg-purple-50 border border-purple-200'
                      : 'bg-purple-900/20 border border-purple-700/50'
                  }`}
                >
                  <div className={`flex items-center gap-3 mb-3 ${
                    theme === 'light' ? 'text-purple-700' : 'text-purple-300'
                  }`}>
                    <CpuChipIcon className="w-5 h-5" />
                    <span className="font-medium">AI Response</span>
                  </div>
                  <p className={`text-lg leading-relaxed ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    {conversation.aiResponse}
                  </p>
                </motion.div>

                {/* Metadata */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`p-4 rounded-xl ${
                    theme === 'light'
                      ? 'bg-gray-50 border border-gray-200'
                      : 'bg-gray-800 border border-gray-600'
                  }`}
                >
                  <h3 className={`font-medium mb-3 ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    Conversation Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={`font-medium ${
                        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        ID:
                      </span>
                      <span className={`ml-2 font-mono ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {conversation.id}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        Time:
                      </span>
                      <span className={`ml-2 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {conversation.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        Date:
                      </span>
                      <span className={`ml-2 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {conversation.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className={`font-medium ${
                        theme === 'light' ? 'text-gray-700' : 'text-gray-300'
                      }`}>
                        Character Count:
                      </span>
                      <span className={`ml-2 ${
                        theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {(conversation.userMessage + conversation.aiResponse).length}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Footer */}
              <div className={`p-4 border-t ${
                theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-gray-700 bg-gray-800'
              }`}>
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
