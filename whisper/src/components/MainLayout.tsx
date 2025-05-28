'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ConversationHistory from '@/components/ConversationHistory';
import ThemeToggle from '@/components/ThemeToggle';

interface MainLayoutProps {
  children: React.ReactNode;
  onNewChat?: () => void;
  onSelectConversation?: (sessionId: string) => void;
}

export default function MainLayout({ children, onNewChat, onSelectConversation }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div 
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'var(--color-background-overlay)' }}
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ 
          backgroundColor: 'var(--color-background-secondary)',
          borderColor: 'var(--color-border-primary)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: 'var(--color-border-primary)' }}
          >
            <h2 
              className="text-lg font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Conversations
            </h2>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--color-brand-primary)',
                color: 'var(--color-text-inverse)',
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">New Chat</span>
            </button>
          </div>

          {/* Conversation History */}
          <div className="flex-1 overflow-hidden">
            <ConversationHistory 
              onSelectConversation={(sessionId) => {
                onSelectConversation?.(sessionId);
                setIsSidebarOpen(false); // Close sidebar on mobile after selection
              }}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header for mobile */}
        <div 
          className="md:hidden flex items-center justify-between p-4 border-b"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            borderColor: 'var(--color-border-primary)'
          }}
        >
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <h1 
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Splatter
          </h1>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={onNewChat}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--color-brand-primary)',
                color: 'var(--color-text-inverse)',
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop header */}
        <div 
          className="hidden md:flex items-center justify-between p-4 border-b"
          style={{ 
            backgroundColor: 'var(--color-background-card)',
            borderColor: 'var(--color-border-primary)'
          }}
        >
          <h1 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Splatter
          </h1>
          
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <button
              onClick={onNewChat}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--color-brand-primary)',
                color: 'var(--color-text-inverse)',
              }}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">New Chat</span>
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
