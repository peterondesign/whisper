'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StorageService } from '@/services/storageService';
import { OpenAIService } from '@/services/openaiService';
import { Moment, ChatMessage } from '@/types';

interface ConversationSession {
  id: string;
  title: string;
  timestamp: Date;
  momentCount: number;
  lastMessage: string;
  moments: Moment[];
  messages: ChatMessage[];
}

interface ConversationHistoryProps {
  onSelectConversation: (sessionId: string) => void;
  className?: string;
}

export default function ConversationHistory({ onSelectConversation, className = "" }: ConversationHistoryProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const storageService = StorageService.getInstance();
  const openaiService = OpenAIService.getInstance();

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const sessionList = storageService.getSessionList();
      const conversationSessions: ConversationSession[] = [];

      for (const sessionData of sessionList) {
        const session = storageService.loadSession(sessionData.id);
        if (session && session.messages.length > 0) {
          const lastMessage = session.messages
            .filter(m => !m.isBot)
            .pop()?.text || 'No messages';

          // Generate title for the first moment if available
          let title = `Chat from ${session.timestamp.toLocaleDateString()}`;
          if (session.moments.length > 0) {
            title = await openaiService.generateMomentTitle(session.moments[0]);
          }

          conversationSessions.push({
            id: session.id,
            title,
            timestamp: session.timestamp,
            momentCount: session.moments.length,
            lastMessage: lastMessage.substring(0, 100),
            moments: session.moments,
            messages: session.messages
          });
        }
      }

      conversationSessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setSessions(conversationSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [storageService, openaiService]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const deleteSession = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      storageService.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    }
  };

  const toggleExpanded = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div 
        className={`flex items-center justify-center h-64 ${className}`}
        style={{ backgroundColor: 'var(--color-background-primary)' }}
      >
        <div className="animate-pulse flex space-x-4">
          <div 
            className="rounded-full h-10 w-10"
            style={{ backgroundColor: 'var(--color-background-tertiary)' }}
          ></div>
          <div className="space-y-2">
            <div 
              className="h-4 rounded w-32"
              style={{ backgroundColor: 'var(--color-background-tertiary)' }}
            ></div>
            <div 
              className="h-4 rounded w-24"
              style={{ backgroundColor: 'var(--color-background-tertiary)' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div 
        className={`text-center py-12 ${className}`}
        style={{ backgroundColor: 'var(--color-background-primary)' }}
      >
        <div 
          className="text-6xl mb-4"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          💭
        </div>
        <h3 
          className="text-lg font-medium mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          No conversations yet
        </h3>
        <p 
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Start your first conversation to begin collecting moments!
        </p>
      </div>
    );
  }

  return (
    <div 
      className={`${className} pb-20 md:pb-0`}
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      <div className="p-4">
        <h2 
          className="text-xl font-bold mb-6"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Conversation History
        </h2>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer overflow-hidden"
              style={{
                backgroundColor: 'var(--color-background-card)',
                borderColor: 'var(--color-border-primary)',
              }}
              onClick={() => onSelectConversation(session.id)}
            >
              {/* Session Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="font-medium text-sm md:text-base truncate"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {session.title}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span 
                        className="text-xs"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {formatRelativeTime(session.timestamp)}
                      </span>
                      <span 
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ 
                          backgroundColor: 'var(--color-brand-primary)',
                          color: 'var(--color-text-inverse)',
                        }}
                      >
                        {session.momentCount} moments
                      </span>
                    </div>
                    <p 
                      className="text-xs mt-2 line-clamp-2"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {session.lastMessage}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={(e) => toggleExpanded(session.id, e)}
                      className="p-1 rounded transition-colors"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    >
                      <svg 
                        className={`w-4 h-4 transition-transform ${
                          expandedSession === session.id ? 'rotate-180' : ''
                        }`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-1 rounded transition-colors hover:opacity-70"
                      style={{ color: 'var(--color-status-error)' }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Moments */}
              {expandedSession === session.id && session.moments.length > 0 && (
                <div 
                  className="border-t px-4 py-3"
                  style={{ borderColor: 'var(--color-border-primary)' }}
                >
                  <h4 
                    className="text-sm font-medium mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Moments captured:
                  </h4>
                  <div className="space-y-2">
                    {session.moments.map((moment, index) => (
                      <div 
                        key={moment.id}
                        className="text-xs p-2 rounded"
                        style={{ backgroundColor: 'var(--color-background-tertiary)' }}
                      >
                        <div 
                          className="font-medium"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {index + 1}. {moment.description.substring(0, 80)}
                          {moment.description.length > 80 && '...'}
                        </div>
                        {moment.location && (
                          <div 
                            className="mt-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            📍 {moment.location}
                          </div>
                        )}
                        {moment.emotion && (
                          <div 
                            className="mt-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            💝 {moment.emotion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
