'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import FloatingAtoms from '@/components/FloatingAtoms';
import ConversationHistory from '@/components/ConversationHistory';
import ConversationDetail from '@/components/ConversationDetail';
import { getConversationSessions, getOrCreateDeviceId, ConversationSession } from '@/lib/supabase';
import { Conversation } from '@/components/VoiceCompanion';

export default function SplatterPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const sessions = await getConversationSessions(deviceId);
      
      // Convert sessions to conversations
      const allConversations: Conversation[] = [];
      
      sessions.forEach((session: ConversationSession) => {
        session.conversation.forEach((msg, index) => {
          allConversations.push({
            id: `${session.session_id}-${index}`,
            timestamp: new Date(msg.timestamp),
            userMessage: msg.userMessage,
            aiResponse: msg.aiResponse
          });
        });
      });

      // Sort by timestamp (newest first)
      allConversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedConversation(null);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
          : 'bg-gradient-to-br from-gray-900 to-black'
      }`}>
        <div className={`text-center ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>Loading your conversation memories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
        : 'bg-gradient-to-br from-gray-900 to-black'
    }`}>
      {/* Header */}
      <div className="relative z-40">
        <div className="flex items-center justify-between p-6">
          <motion.button
            onClick={() => router.push('/')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              theme === 'light'
                ? 'bg-white/80 hover:bg-white text-gray-700 shadow-lg shadow-gray-200/50'
                : 'bg-gray-800/80 hover:bg-gray-800 text-gray-200 shadow-lg shadow-black/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back to Voice</span>
          </motion.button>

          <div className={`flex items-center gap-3 px-4 py-2 rounded-lg backdrop-blur-md ${
            theme === 'light'
              ? 'bg-white/80 border border-gray-200'
              : 'bg-gray-800/80 border border-gray-700'
          }`}>
            <GlobeAltIcon className={`w-6 h-6 ${
              theme === 'light' ? 'text-blue-600' : 'text-blue-400'
            }`} />
            <div>
              <h1 className={`text-xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                Memory Spots
              </h1>
              <p className={`text-sm ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-[calc(100vh-120px)]">
        {/* Conversation History Sidebar */}
        <ConversationHistory
          conversations={conversations}
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
        />

        {/* 3D Floating Atoms */}
        <div className="h-full">
          <FloatingAtoms
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            radius={6}
          />
        </div>

        {/* Conversation Detail Modal */}
        <ConversationDetail
          conversation={selectedConversation}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />
      </div>

      {/* Instructions Overlay */}
      {conversations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className={`text-center max-w-md mx-auto p-8 rounded-2xl backdrop-blur-md ${
            theme === 'light'
              ? 'bg-white/80 border border-gray-200'
              : 'bg-gray-900/80 border border-gray-700'
          }`}>
            <div className={`text-6xl mb-6`}>🌌</div>
            <h2 className={`text-2xl font-bold mb-4 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              Your Memory Cosmos Awaits
            </h2>
            <p className={`text-lg mb-6 ${
              theme === 'light' ? 'text-gray-600' : 'text-gray-300'
            }`}>
              Each conversation becomes a glowing atom in your personal universe of memories.
            </p>
            <motion.button
              onClick={() => router.push('/')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                theme === 'light'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your First Conversation
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
