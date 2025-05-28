'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatbotState } from '@/hooks/useChatbotState';
import { NLPService } from '@/services/nlpService';
import { StorageService } from '@/services/storageService';
import VoiceInput from '@/components/VoiceInput';
import ChatMessage from '@/components/ChatMessage';
import MomentDisplay from '@/components/MomentDisplay';
import { generateId } from '@/utils/helpers';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nlpService = NLPService.getInstance();
  const storageService = StorageService.getInstance();

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

  // Initialize with greeting
  useEffect(() => {
    if (messages.length === 0 && context.state === 'greeting') {
      const greeting = nlpService.generateResponse('greeting');
      addMessage(greeting, true, 'greeting');
      updateState('collecting_moments');
    }
  }, [messages.length, context.state, addMessage, updateState, nlpService]);

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
    switch (context.state) {
      case 'collecting_moments':
        await handleMomentCollection(input);
        break;
      case 'selecting_moment':
        await handleMomentSelection(input);
        break;
      case 'asking_location':
        await handleLocationInput(input);
        break;
      case 'asking_emotion':
        await handleEmotionInput(input);
        break;
      case 'summarizing':
        await handleSummaryConfirmation(input);
        break;
      default:
        addMessage("I'm not sure how to help with that right now.", true);
    }
  };

  const handleMomentCollection = async (input: string) => {
    const result = nlpService.processUserInput(input, 'moment');
    
    if (!result.isValid) {
      let response = "I'd love to hear more details about that moment. ";
      if (result.suggestions) {
        response += result.suggestions[0];
      }
      addMessage(response, true, 'question');
      return;
    }

    // Add the moment
    const moment = addMoment(result.processedText);
    
    // Confirm the moment
    const confirmation = nlpService.generateResponse('momentConfirmed');
    addMessage(confirmation, true, 'confirmation');

    // Check if we need more moments
    if (context.moments.length + 1 >= context.totalMomentsToCollect) {
      // We have enough moments, show them and ask for selection
      setTimeout(() => {
        const allMomentsMessage = nlpService.generateResponse('allMomentsCollected');
        addMessage(allMomentsMessage, true);
        
        setTimeout(() => {
          const selectMessage = nlpService.generateResponse('selectMoment');
          addMessage(selectMessage, true, 'question');
          updateState('selecting_moment');
        }, 1000);
      }, 1000);
    } else {
      // Ask for more moments
      setTimeout(() => {
        const moreMessage = nlpService.generateResponse('needsMoreMoments');
        addMessage(moreMessage, true, 'question');
      }, 1000);
    }
  };

  const handleMomentSelection = async (input: string) => {
    const result = nlpService.processUserInput(input, 'selection');
    
    if (!result.isValid) {
      let response = "I didn't catch which moment you'd like to explore. ";
      if (result.suggestions) {
        response += result.suggestions[0];
      }
      addMessage(response, true, 'question');
      return;
    }

    const selectedIndex = parseInt(result.processedText);
    if (selectedIndex >= 0 && selectedIndex < context.moments.length) {
      const selectedMoment = context.moments[selectedIndex];
      selectMoment(selectedMoment);
      
      addMessage(`Great choice! Let's explore: "${selectedMoment.description}"`, true, 'confirmation');
      
      setTimeout(() => {
        const locationQuestion = nlpService.generateResponse('askLocation');
        addMessage(locationQuestion, true, 'question');
        updateState('asking_location');
      }, 1000);
    } else {
      addMessage("That number doesn't match any of your moments. Please choose 1, 2, or 3.", true, 'question');
    }
  };

  const handleLocationInput = async (input: string) => {
    const result = nlpService.processUserInput(input, 'location');
    
    if (!result.isValid) {
      let response = "Could you tell me more about where this happened? ";
      if (result.suggestions) {
        response += result.suggestions[0];
      }
      addMessage(response, true, 'question');
      return;
    }

    if (context.selectedMoment) {
      updateMoment(context.selectedMoment.id, { location: result.processedText });
      addMessage(`Perfect! I've noted that this happened at: ${result.processedText}`, true, 'confirmation');
      
      setTimeout(() => {
        const emotionQuestion = nlpService.generateResponse('askEmotion');
        addMessage(emotionQuestion, true, 'question');
        updateState('asking_emotion');
      }, 1000);
    }
  };

  const handleEmotionInput = async (input: string) => {
    const result = nlpService.processUserInput(input, 'emotion');
    
    if (!result.isValid) {
      let response = "I'd love to understand your feelings better. ";
      if (result.suggestions) {
        response += result.suggestions[0];
      }
      addMessage(response, true, 'question');
      return;
    }

    if (context.selectedMoment) {
      updateMoment(context.selectedMoment.id, { 
        emotion: result.processedText,
        confirmed: true 
      });
      
      addMessage(`Thank you for sharing! I can feel that this moment made you feel ${result.processedText}.`, true, 'confirmation');
      
      setTimeout(() => {
        const summaryMessage = nlpService.generateResponse('summary');
        addMessage(summaryMessage, true);
        
        setTimeout(() => {
          const confirmMessage = nlpService.generateResponse('confirmSummary');
          addMessage(confirmMessage, true, 'question');
          updateState('summarizing');
        }, 1000);
      }, 1000);
    }
  };

  const handleSummaryConfirmation = async (input: string) => {
    const isConfirmed = /^(yes|yeah|yep|correct|right|good|perfect|that's right)/i.test(input.toLowerCase());
    
    if (isConfirmed) {
      addMessage("Wonderful! I've captured this beautiful moment. Would you like to explore another moment or finish here?", true);
      
      // Check if there are more moments to explore
      const unconfirmedMoments = context.moments.filter(m => !m.confirmed);
      if (unconfirmedMoments.length > 0) {
        setTimeout(() => {
          addMessage("You have other moments we could explore, or you can say 'finish' to see your complete session.", true, 'question');
          updateState('selecting_moment');
        }, 1000);
      } else {
        setTimeout(() => {
          addMessage("All your moments have been captured! Thank you for sharing these beautiful memories with me.", true);
          updateState('complete');
        }, 1000);
      }
    } else {
      addMessage("No problem! What would you like to change about this moment?", true, 'question');
      updateState('asking_location'); // Allow them to re-enter details
    }
  };

  const handleReset = () => {
    resetChat();
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
                  <p><strong>Where:</strong> {context.selectedMoment.location}</p>
                  <p><strong>How it felt:</strong> {context.selectedMoment.emotion}</p>
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
    case 'asking_emotion':
      return 'Asking Emotion';
    case 'summarizing':
      return 'Summarizing';
    case 'complete':
      return 'Complete';
    default:
      return 'Unknown';
  }
}
