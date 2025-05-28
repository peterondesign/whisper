'use client';

import React, { useState } from 'react';
// import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

interface NavigationProps {
  currentView: 'chat' | 'history';
  onViewChange: (view: 'chat' | 'history') => void;
  onNewChat: () => void;
  className?: string;
}

export default function Navigation({ currentView, onViewChange, onNewChat, className = "" }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <>
      {/* Desktop Navigation */}
      <nav 
        className={`hidden md:flex items-center justify-between p-4 border-b ${className}`}
        style={{
          backgroundColor: 'var(--color-background-card)',
          borderColor: 'var(--color-border-primary)',
        }}
      >
        <div className="flex items-center space-x-6">
          <h1 
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Moments Chatbot
          </h1>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onViewChange('chat')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                currentView === 'chat' 
                  ? 'font-medium' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: currentView === 'chat' ? 'var(--color-brand-primary)' : 'transparent',
                color: currentView === 'chat' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              }}
            >
              Chat
            </button>
            
            <button
              onClick={() => onViewChange('history')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                currentView === 'history' 
                  ? 'font-medium' 
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: currentView === 'history' ? 'var(--color-brand-primary)' : 'transparent',
                color: currentView === 'history' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
              }}
            >
              History
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onNewChat}
            className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: 'var(--color-brand-accent)',
              color: 'var(--color-text-inverse)',
            }}
          >
            New Chat
          </button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav 
        className="md:hidden border-b"
        style={{
          backgroundColor: 'var(--color-background-card)',
          borderColor: 'var(--color-border-primary)',
        }}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4">
          <h1 
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Moments
          </h1>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--color-background-tertiary)',
                color: 'var(--color-text-primary)',
              }}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div 
            className="border-t p-4 space-y-3"
            style={{ borderColor: 'var(--color-border-primary)' }}
          >
            <button
              onClick={() => {
                onViewChange('chat');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === 'chat' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: currentView === 'chat' ? 'var(--color-brand-primary)' : 'var(--color-background-tertiary)',
                color: currentView === 'chat' ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
              }}
            >
              💬 Chat
            </button>
            
            <button
              onClick={() => {
                onViewChange('history');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === 'history' ? 'font-medium' : ''
              }`}
              style={{
                backgroundColor: currentView === 'history' ? 'var(--color-brand-primary)' : 'var(--color-background-tertiary)',
                color: currentView === 'history' ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
              }}
            >
              📚 History
            </button>
            
            <button
              onClick={() => {
                onNewChat();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--color-brand-accent)',
                color: 'var(--color-text-inverse)',
              }}
            >
              ✨ New Chat
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation (Alternative) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 border-t safe-area-pb"
        style={{
          backgroundColor: 'var(--color-background-card)',
          borderColor: 'var(--color-border-primary)',
        }}
      >
        <div className="flex items-center justify-around p-2">
          <button
            onClick={() => onViewChange('chat')}
            className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
              currentView === 'chat' ? 'opacity-100' : 'opacity-60'
            }`}
            style={{
              color: currentView === 'chat' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
            }}
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
            <span className="text-xs">Chat</span>
          </button>
          
          <button
            onClick={onNewChat}
            className="flex flex-col items-center p-3 rounded-lg transition-all duration-200"
            style={{ color: 'var(--color-brand-accent)' }}
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">New</span>
          </button>
          
          <button
            onClick={() => onViewChange('history')}
            className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
              currentView === 'history' ? 'opacity-100' : 'opacity-60'
            }`}
            style={{
              color: currentView === 'history' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
            }}
          >
            <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
              <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">History</span>
          </button>
        </div>
      </div>
    </>
  );
}
