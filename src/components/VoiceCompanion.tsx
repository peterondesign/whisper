'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import ParticleSystem from './ParticleSystem';
import VoiceHandler from './VoiceHandler';
import SkeletalLoadingState from './SkeletalLoadingState';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  createConversationSession, 
  updateConversationSession, 
  endConversationSession,
  getOrCreateDeviceId,
  ConversationMessage 
} from '@/lib/supabase';

export type AppState = 'splash' | 'waiting' | 'listening' | 'processing' | 'conversations';

export interface Conversation {
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  position?: [number, number, number];
}

export default function VoiceCompanion() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [appState, setAppState] = useState<AppState>('splash');
  const [isListening, setIsListening] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create session only when we have the first conversation
  const ensureSession = async () => {
    if (!currentSessionId) {
      const deviceId = getOrCreateDeviceId();
      const sessionId = await createConversationSession(deviceId);
      if (sessionId) {
        setCurrentSessionId(sessionId);
      }
      return sessionId;
    }
    return currentSessionId;
  };

  useEffect(() => {
    if (!isMounted) return;
    
    // Initialize with welcome message
    const timer = setTimeout(() => {
      setCurrentText("Think back to yesterday... Can you tell me about one specific moment that stands out to you?");
      setAppState('waiting');
    }, 1000);

    return () => clearTimeout(timer);
  }, [isMounted]);

  // Cleanup effect to end session when component unmounts
  useEffect(() => {
    return () => {
      if (currentSessionId) {
        endConversationSession(currentSessionId);
      }
    };
  }, [currentSessionId]);

  const handleVoiceStart = () => {
    setIsListening(true);
    setAppState('listening');
    setCurrentText('Listening...');
  };

  const handleVoiceEnd = (transcript: string) => {
    setIsListening(false);
    setAppState('processing');
    setCurrentText('Processing your response...');
    setCurrentUserMessage(transcript);
  };

  const handleResponse = async (response: string) => {
    // Only create conversation if we have a valid user message
    if (!currentUserMessage || currentUserMessage.trim() === '') {
      setCurrentText(response);
      return;
    }

    const newConversation: Conversation = {
      id: Date.now().toString(),
      timestamp: new Date(),
      userMessage: currentUserMessage.trim(),
      aiResponse: response,
      position: [
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      ]
    };

    const updatedConversations = [...conversations, newConversation];
    setConversations(updatedConversations);
    setAppState('conversations');
    setCurrentText(response);

    // Save to Supabase only if we have actual conversation data
    if (updatedConversations.length > 0) {
      const sessionId = await ensureSession();
      if (sessionId) {
        const conversationMessages: ConversationMessage[] = updatedConversations
          .filter(conv => conv.userMessage && conv.userMessage.trim() !== '' && conv.aiResponse && conv.aiResponse.trim() !== '')
          .map(conv => ({
            timestamp: conv.timestamp.toISOString(),
            userMessage: conv.userMessage,
            aiResponse: conv.aiResponse
          }));
        
        // Only update if we have valid messages to save
        if (conversationMessages.length > 0) {
          await updateConversationSession(sessionId, conversationMessages);
        }
      }
    }

    // Clear the current user message after processing
    setCurrentUserMessage('');
  };

  // Prevent SSR issues
  if (!isMounted) {
    return <SkeletalLoadingState />;
  }

  return (
    <div className={`relative w-full h-screen flex flex-col items-center justify-center transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
        : 'bg-gradient-to-br from-gray-900 to-black'
    }`}>
      {/* 3D Particle System */}
      <div className="absolute inset-0">
        <ParticleSystem 
          state={appState} 
          isListening={isListening}
          conversations={conversations}
          theme={theme}
        />
      </div>

      {/* UI Overlay - Central Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className={`w-full max-w-md mx-auto backdrop-blur-lg rounded-2xl shadow-2xl transition-all duration-300 ${
          theme === 'light'
            ? 'bg-white/90 border border-gray-200 shadow-gray-200/50'
            : 'bg-gray-900/90 border border-gray-700 shadow-black/50'
        }`}>
          <div className="p-8">
            {currentText && (
              <h1 className={`text-xl md:text-2xl font-medium mb-8 text-center transition-colors duration-300 ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {currentText}
              </h1>
            )}

            {(appState === 'waiting' || appState === 'listening' || appState === 'processing') && (
              <VoiceHandler
                onStart={handleVoiceStart}
                onEnd={handleVoiceEnd}
                onResponse={handleResponse}
                theme={theme}
              />
            )}

            {appState === 'conversations' && conversations.length > 0 && (
              <div className="space-y-6">
                <div className={`p-4 rounded-lg text-left transition-colors duration-300 ${
                  theme === 'light' 
                    ? 'bg-gray-50 border border-gray-200' 
                    : 'bg-gray-800/70 border border-gray-700'
                }`}>
                  <p className={`text-sm mb-3 font-medium ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    Latest conversation:
                  </p>
                  <div className="space-y-2">
                    <p className={`text-sm ${theme === 'light' ? 'text-blue-700' : 'text-gray-300'}`}>
                      <span className="font-medium">You:</span> {conversations[conversations.length - 1]?.userMessage}
                    </p>
                    <p className={`text-sm ${theme === 'light' ? 'text-green-700' : 'text-gray-400'}`}>
                      <span className="font-medium">AI:</span> {conversations[conversations.length - 1]?.aiResponse}
                    </p>
                  </div>
                </div>
                
                <VoiceHandler
                  onStart={handleVoiceStart}
                  onEnd={handleVoiceEnd}
                  onResponse={handleResponse}
                  theme={theme}
                  continueMode={true}
                />

                {/* Memory Cosmos Navigation */}
                <motion.button
                  onClick={() => router.push('/splatter')}
                  className={`w-full flex items-center justify-center gap-2 p-3 rounded-lg transition-all duration-200 ${
                    theme === 'light'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlobeAltIcon className="w-5 h-5" />
                  <span className="font-medium">Explore Memory Cosmos</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
