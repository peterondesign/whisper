'use client';

import { useState, useCallback } from 'react';
import { ChatbotState, ChatbotContext, Moment, ChatMessage } from '@/types';
import { generateId } from '@/utils/helpers';

const INITIAL_CONTEXT: ChatbotContext = {
  state: 'greeting',
  moments: [],
  currentMomentIndex: 0,
  totalMomentsToCollect: 3,
};

export const useChatbotState = () => {
  const [context, setContext] = useState<ChatbotContext>(INITIAL_CONTEXT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = useCallback((text: string, isBot: boolean, type?: ChatMessage['type']) => {
    const message: ChatMessage = {
      id: generateId(),
      text,
      isBot,
      timestamp: new Date(),
      type,
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);

  const updateState = useCallback((newState: ChatbotState) => {
    setContext(prev => ({ ...prev, state: newState }));
  }, []);

  const addMoment = useCallback((description: string) => {
    const moment: Moment = {
      id: generateId(),
      description,
      timestamp: new Date(),
      confirmed: false,
    };
    
    setContext(prev => ({
      ...prev,
      moments: [...prev.moments, moment],
      currentMomentIndex: prev.currentMomentIndex + 1,
    }));
    
    return moment;
  }, []);

  const updateMoment = useCallback((momentId: string, updates: Partial<Moment>) => {
    setContext(prev => ({
      ...prev,
      moments: prev.moments.map(m => 
        m.id === momentId ? { ...m, ...updates } : m
      ),
    }));
  }, []);

  const selectMoment = useCallback((moment: Moment) => {
    setContext(prev => ({ ...prev, selectedMoment: moment }));
  }, []);

  const resetChat = useCallback(() => {
    setContext(INITIAL_CONTEXT);
    setMessages([]);
  }, []);

  const loadSession = useCallback((session: { moments: Moment[]; messages: ChatMessage[] }) => {
    setContext(prev => ({
      ...prev,
      moments: session.moments,
      state: session.moments.length > 0 ? 'complete' : 'greeting',
    }));
    setMessages(session.messages);
  }, []);

  const getNextState = useCallback((): ChatbotState => {
    const { state, moments, selectedMoment, totalMomentsToCollect } = context;
    
    switch (state) {
      case 'greeting':
        return 'collecting_moments';
      case 'collecting_moments':
        return moments.length >= totalMomentsToCollect ? 'selecting_moment' : 'collecting_moments';
      case 'selecting_moment':
        return selectedMoment ? 'asking_location' : 'selecting_moment';
      case 'asking_location':
        return 'asking_emotion';
      case 'asking_emotion':
        return 'summarizing';
      case 'summarizing':
        return 'complete';
      default:
        return state;
    }
  }, [context]);

  return {
    context,
    messages,
    addMessage,
    updateState,
    addMoment,
    updateMoment,
    selectMoment,
    resetChat,
    loadSession,
    getNextState,
  };
};
