'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatbotState } from '@/hooks/useChatbotState';
import { OpenAIService } from '@/services/openaiService';
import { StorageService } from '@/services/storageService';
import { MemoryService } from '@/services/memoryService';
import VoiceInput from '@/components/VoiceInput';
import ChatMessage from '@/components/ChatMessage';
import MomentDisplay from '@/components/MomentDisplay';
import MemoryVisualization from '@/components/MemoryVisualization';
import { generateId } from '@/utils/helpers';
import { Moment, ConversationMemory } from '@/types';

interface MomentsChatbotProps {
  selectedSessionId?: string | null;
}

export default function MomentsChatbot({ selectedSessionId }: MomentsChatbotProps) {
  const {
    context,
    messages,
    addMessage,
    updateState,
    addMoment,
    updateMoment,
    selectMoment,
    resetChat,
    loadSession,
  } = useChatbotState();

  const [sessionId, setSessionId] = useState(() => generateId());
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationMemory, setConversationMemory] = useState<ConversationMemory | null>(null);
  const [isEnhancedMode, setIsEnhancedMode] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openaiService = OpenAIService.getInstance();
  const storageService = StorageService.getInstance();
  const memoryService = MemoryService.getInstance();

  // Load selected session when prop changes
  useEffect(() => {
    if (selectedSessionId) {
      const session = storageService.loadSession(selectedSessionId);
      if (session) {
        loadSession(session);
        setSessionId(selectedSessionId);
      }
    } else {
      // Start new session
      resetChat();
      setSessionId(generateId());
    }
  }, [selectedSessionId, loadSession, resetChat, storageService]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save session data when it changes
  useEffect(() => {
    if (messages.length > 0) {
      storageService.saveSession(sessionId, context.moments, messages);
    }
  }, [context.moments, messages, sessionId, storageService]);

  // Initialize conversation memory and greeting
  useEffect(() => {
    if (!conversationMemory) {
      setConversationMemory(memoryService.createEmptyMemory());
    }
    
    if (messages.length === 0 && context.state === 'greeting') {
      const initializeConversation = async () => {
        try {
          const memory = memoryService.createEmptyMemory();
          const response = await openaiService.generateProgressiveResponse(
            'Hello! I\'d love to help you capture some meaningful moments from your day.',
            {
              state: 'greeting',
              moments: [],
              previousMessages: [],
              memory
            }
          );
          
          addMessage(response.response, true, 'greeting');
          if (response.memoryFragments && response.memoryFragments.length > 0) {
            setConversationMemory(prev => 
              prev ? memoryService.addMemoryFragments(prev, response.memoryFragments!) : memory
            );
          }
          if (response.nextState) {
            updateState(response.nextState);
          } else {
            updateState('collecting_moments');
          }
        } catch (error) {
          console.error('Error initializing conversation:', error);
          addMessage("Hello! I'd love to help you capture some meaningful moments from your day. What's something interesting that happened to you today?", true, 'greeting');
          updateState('collecting_moments');
        }
      };
      
      initializeConversation();
    }
  }, [messages.length, context.state, addMessage, updateState, openaiService, memoryService, conversationMemory]);

  const handleUserInput = async (input: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // Add user message
    addMessage(input, false);

    // Process based on current state
    try {
      await processUserInput(input);
    } catch (error) {
      console.error('Error processing input:', error);
      addMessage("I'm sorry, I encountered an error. Could you please try again?", true);
    } finally {
      setIsProcessing(false);
    }
  };

  const processUserInput = async (input: string) => {
    if (!conversationMemory) {
      addMessage("I'm sorry, there seems to be an issue with the conversation memory. Please try again.", true);
      return;
    }

    try {
      // Use OpenAI progressive response system
      const response = await openaiService.generateProgressiveResponse(
        input,
        {
          state: context.state,
          moments: context.moments,
          selectedMoment: context.selectedMoment,
          previousMessages: messages,
          memory: conversationMemory
        }
      );

      // Add bot response
      addMessage(response.response, true);

      // Update conversation memory with new fragments
      if (response.memoryFragments && response.memoryFragments.length > 0) {
        setConversationMemory(prev => 
          prev ? memoryService.addMemoryFragments(prev, response.memoryFragments!) : prev
        );
      }

      // Handle detected moments
      if (response.detectedMoments && response.detectedMoments.length > 0) {
        response.detectedMoments.forEach(momentData => {
          if (momentData.description) {
            const moment = addMoment(momentData.description);
            // Update the moment with extracted fields
            updateMoment(moment.id, {
              location: momentData.location,
              action: momentData.action,
              thinking: momentData.thinking,
              emotion: momentData.emotion,
              dialogue: momentData.dialogue
            });
          }
        });
      }

      // Update state if suggested
      if (response.nextState) {
        updateState(response.nextState);
      }

    } catch (error) {
      console.error('Error in progressive response:', error);
      addMessage("I'm having trouble processing that. Could you rephrase or try again?", true);
    }
  };

  const handleReset = () => {
    resetChat();
    setConversationMemory(memoryService.createEmptyMemory());
    // The useEffect will trigger the greeting automatically
  };

  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: 'var(--color-background-primary)' }}
    >
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            
            {/* Show moments when appropriate */}
            {(context.state === 'selecting_moment' || context.state === 'complete') && context.moments.length > 0 && (
              <MomentDisplay
                moments={context.moments}
                selectedMoment={context.selectedMoment}
                onSelectMoment={(moment) => {
                  selectMoment(moment);
                  handleUserInput(`${context.moments.indexOf(moment) + 1}`);
                }}
                showSelection={context.state === 'selecting_moment'}
                className="mx-4"
              />
            )}

            {/* Show summary when appropriate */}
            {context.state === 'summarizing' && context.selectedMoment && (
              <div 
                className="mx-4 rounded-lg p-4 border"
                style={{ 
                  backgroundColor: 'var(--color-background-tertiary)',
                  borderColor: 'var(--color-brand-primary)'
                }}
              >
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: 'var(--color-brand-primary)' }}
                >
                  Moment Summary:
                </h4>
                <div 
                  className="text-sm space-y-1"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  <p><strong>What:</strong> {context.selectedMoment.description}</p>
                  {context.selectedMoment.location && (
                    <p><strong>Where:</strong> {context.selectedMoment.location}</p>
                  )}
                  {context.selectedMoment.action && (
                    <p><strong>Action:</strong> {context.selectedMoment.action}</p>
                  )}
                  {context.selectedMoment.thinking && (
                    <p><strong>Thinking:</strong> {context.selectedMoment.thinking}</p>
                  )}
                  {context.selectedMoment.emotion && (
                    <p><strong>Emotion:</strong> {context.selectedMoment.emotion}</p>
                  )}
                  {context.selectedMoment.dialogue && (
                    <p><strong>Dialogue:</strong> "{context.selectedMoment.dialogue}"</p>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div 
            className="border-t p-4"
            style={{
              backgroundColor: 'var(--color-background-card)',
              borderColor: 'var(--color-border-primary)'
            }}
          >
            <VoiceInput
              onInput={handleUserInput}
              disabled={isProcessing || context.state === 'complete'}
              placeholder={
                context.state === 'complete'
                  ? "Session complete. Start a new chat to continue."
                  : isProcessing
                  ? "Processing..."
                  : "Share your thoughts or use voice input..."
              }
            />
          </div>
        </div>

        {/* Sidebar - Session Info */}
        <div 
          className="hidden md:block w-80 border-l p-4 overflow-y-auto"
          style={{
            backgroundColor: 'var(--color-background-secondary)',
            borderColor: 'var(--color-border-primary)'
          }}
        >
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Session Progress
          </h3>
          
          {/* State Indicator */}
          <div 
            className="mb-4 p-3 rounded-lg"
            style={{ backgroundColor: 'var(--color-background-tertiary)' }}
          >
            <div 
              className="text-sm mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Current Step:
            </div>
            <div 
              className="font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {getStateLabel(context.state)}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-4">
            <div 
              className="text-sm mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Moments Collected: {context.moments.length}/{context.totalMomentsToCollect}
            </div>
            <div 
              className="w-full rounded-full h-2"
              style={{ backgroundColor: 'var(--color-background-tertiary)' }}
            >
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--color-brand-primary)',
                  width: `${(context.moments.length / context.totalMomentsToCollect) * 100}%` 
                }}
              />
            </div>
          </div>

          {/* Memory Visualization */}
          {isEnhancedMode && conversationMemory && (
            <div className="mb-4">
              <MemoryVisualization 
                memory={conversationMemory}
                isVisible={true}
              />
            </div>
          )}

          {/* Moments List */}
          {context.moments.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Your Moments</h4>
              <div className="space-y-2">
                {context.moments.map((moment, index) => (
                  <div
                    key={moment.id}
                    className={`p-2 rounded border text-xs ${
                      moment.confirmed
                        ? 'bg-green-50 border-green-200'
                        : context.selectedMoment?.id === moment.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium">#{index + 1}</div>
                    <div className="text-gray-600 line-clamp-2">{moment.description}</div>
                    {moment.confirmed && (
                      <div className="text-green-600 mt-1">✓ Complete</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStateLabel(state: string): string {
  switch (state) {
    case 'greeting':
      return 'Welcome';
    case 'collecting_moments':
      return 'Collecting Moments';
    case 'selecting_moment':
      return 'Selecting Moment';
    case 'asking_location':
      return 'Asking Location';
    case 'asking_action':
      return 'Asking Action';
    case 'asking_thinking':
      return 'Asking Thoughts';
    case 'asking_emotion':
      return 'Asking Emotion';
    case 'asking_dialogue':
      return 'Asking Dialogue';
    case 'free_conversation':
      return 'Free Conversation';
    case 'summarizing':
      return 'Summarizing';
    case 'complete':
      return 'Complete';
    default:
      return 'Unknown';
  }
}
