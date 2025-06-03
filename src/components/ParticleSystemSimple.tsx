'use client';

import { useState, useEffect } from 'react';

export type AppState = 'splash' | 'waiting' | 'listening' | 'processing' | 'conversations';

export interface Conversation {
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  position?: [number, number, number];
}

export interface ParticleSystemProps {
  state: AppState;
  isListening: boolean;
  conversations: Conversation[];
}

export function ParticleSystemSimple({ state, isListening, conversations }: ParticleSystemProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    );
  }

  // Simple animated background instead of Three.js
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className={`absolute inset-0 transition-all duration-1000 ${
          state === 'listening' 
            ? 'bg-gradient-to-br from-blue-900 via-purple-900 to-black animate-pulse' 
            : state === 'processing'
            ? 'bg-gradient-to-br from-green-900 via-blue-900 to-black'
            : 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
        }`}
      />
      
      {/* Simple floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-white/30 rounded-full animate-pulse`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* State indicator */}
      <div className="absolute bottom-4 left-4 text-white/50 text-sm">
        State: {state} | Listening: {isListening ? 'Yes' : 'No'} | Conversations: {conversations.length}
      </div>
    </div>
  );
}
