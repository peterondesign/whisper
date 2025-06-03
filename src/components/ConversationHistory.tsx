'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChatBubbleLeftRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { Conversation } from './VoiceCompanion';

interface ConversationHistoryProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation?: (conversation: Conversation) => void;
}

export default function ConversationHistory({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation
}: ConversationHistoryProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, conversation) => {
    const date = conversation.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(conversation);
    return groups;
  }, {} as Record<string, Conversation[]>);

  // Filter conversations based on search
  const filteredGroups = Object.entries(groupedConversations).reduce((filtered, [date, convs]) => {
    const filteredConvs = convs.filter(conv => 
      conv.userMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.aiResponse.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredConvs.length > 0) {
      filtered[date] = filteredConvs;
    }
    return filtered;
  }, {} as Record<string, Conversation[]>);

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white/90 hover:bg-white text-gray-700 shadow-gray-200/50'
            : 'bg-gray-800/90 hover:bg-gray-800 text-gray-200 shadow-black/50'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? (
            <ChevronLeftIcon className="w-6 h-6" />
          ) : (
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
          )}
        </motion.div>
      </motion.button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed left-0 top-0 h-full w-96 z-50 flex flex-col shadow-2xl ${
                theme === 'light'
                  ? 'bg-white/95 border-r border-gray-200'
                  : 'bg-gray-900/95 border-r border-gray-700'
              }`}
            >
              {/* Header */}
              <div className={`p-6 border-b ${
                theme === 'light' ? 'border-gray-200' : 'border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-semibold ${
                    theme === 'light' ? 'text-gray-900' : 'text-white'
                  }`}>
                    Conversation History
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'light'
                        ? 'hover:bg-gray-100 text-gray-500'
                        : 'hover:bg-gray-800 text-gray-400'
                    }`}
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      theme === 'light'
                        ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-500'
                        : 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700 focus:border-blue-400'
                    }`}
                  />
                </div>

                {/* Stats */}
                <div className={`mt-4 text-sm ${
                  theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {conversations.length} conversations
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {Object.keys(filteredGroups).length === 0 ? (
                  <div className={`p-6 text-center ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
                  </div>
                ) : (
                  Object.entries(filteredGroups)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, dayConversations]) => (
                      <div key={date} className="mb-6">
                        {/* Date Header */}
                        <div className={`px-6 py-2 text-sm font-medium sticky top-0 backdrop-blur-md ${
                          theme === 'light'
                            ? 'text-gray-700 bg-white/80'
                            : 'text-gray-300 bg-gray-900/80'
                        }`}>
                          {formatDate(date)}
                        </div>

                        {/* Conversations for this date */}
                        <div className="space-y-2 px-4">
                          {dayConversations
                            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                            .map((conversation) => (
                              <motion.div
                                key={conversation.id}
                                onClick={() => onSelectConversation?.(conversation)}
                                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                                  selectedConversationId === conversation.id
                                    ? theme === 'light'
                                      ? 'bg-blue-50 border-2 border-blue-200'
                                      : 'bg-blue-900/30 border-2 border-blue-500/50'
                                    : theme === 'light'
                                      ? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                                      : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {/* Time */}
                                <div className={`flex items-center gap-1 mb-2 text-xs ${
                                  theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  <ClockIcon className="w-3 h-3" />
                                  {formatTime(conversation.timestamp)}
                                </div>

                                {/* User Message Preview */}
                                <div className={`text-sm font-medium mb-1 ${
                                  theme === 'light' ? 'text-gray-900' : 'text-white'
                                }`}>
                                  {truncateText(conversation.userMessage, 80)}
                                </div>

                                {/* AI Response Preview */}
                                <div className={`text-xs ${
                                  theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                                }`}>
                                  {truncateText(conversation.aiResponse, 60)}
                                </div>

                                {/* Highlight indicator */}
                                {selectedConversationId === conversation.id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"
                                  />
                                )}
                              </motion.div>
                            ))}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
