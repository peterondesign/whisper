'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getConversationSessions, getOrCreateDeviceId, ConversationSession } from '@/lib/supabase';
import { Conversation } from '@/components/VoiceCompanion';

export default function HistoryPage() {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
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

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
          : 'bg-gradient-to-br from-gray-900 to-black'
      }`}>
        <div className={`text-center ${
          theme === 'light' ? 'text-gray-600' : 'text-gray-300'
        }`}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div>Loading conversation history...</div>
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
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${
            theme === 'light' ? 'text-gray-900' : 'text-white'
          }`}>
            Conversation History
          </h1>
          <p className={`${
            theme === 'light' ? 'text-gray-600' : 'text-gray-400'
          }`}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className={`text-center py-16 ${
            theme === 'light'
              ? 'bg-white/80 border border-gray-200'
              : 'bg-gray-800/80 border border-gray-700'
          } rounded-2xl backdrop-blur-lg`}>
            <div className={`text-6xl mb-4 ${
              theme === 'light' ? 'text-gray-400' : 'text-gray-600'
            }`}>💭</div>
            <h3 className={`text-xl font-medium mb-2 ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              No conversations yet
            </h3>
            <p className={`${
              theme === 'light' ? 'text-gray-600' : 'text-gray-400'
            }`}>
              Start a conversation to see your history here
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-6 rounded-xl transition-all duration-200 hover:scale-[1.02] ${
                  theme === 'light'
                    ? 'bg-white/80 hover:bg-white border border-gray-200 shadow-lg shadow-gray-200/50'
                    : 'bg-gray-800/80 hover:bg-gray-800 border border-gray-700 shadow-lg shadow-black/50'
                } backdrop-blur-lg`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`text-sm ${
                    theme === 'light' ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    {conversation.timestamp.toLocaleDateString()} at {conversation.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg ${
                    theme === 'light' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-blue-500/20 border-l-4 border-blue-400'
                  }`}>
                    <p className={`text-sm font-medium mb-1 ${
                      theme === 'light' ? 'text-blue-700' : 'text-blue-300'
                    }`}>You said:</p>
                    <p className={`${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {conversation.userMessage}
                    </p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    theme === 'light' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-green-500/20 border-l-4 border-green-400'
                  }`}>
                    <p className={`text-sm font-medium mb-1 ${
                      theme === 'light' ? 'text-green-700' : 'text-green-300'
                    }`}>AI responded:</p>
                    <p className={`${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {conversation.aiResponse}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
