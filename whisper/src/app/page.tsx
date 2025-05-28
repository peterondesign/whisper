'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import MomentsChatbot from '@/components/MomentsChatbot';

export default function Home() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0); // Force re-render for new chat

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setChatKey(prev => prev + 1); // Force new session
  };

  const handleSelectConversation = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setChatKey(prev => prev + 1); // Force re-render with selected session
  };

  return (
    <main className="h-screen">
      <MainLayout 
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
      >
        <MomentsChatbot 
          key={chatKey}
          selectedSessionId={currentSessionId}
        />
      </MainLayout>
    </main>
  );
}
