'use client';

import React from 'react';
import { ChatMessage } from '@/types';
import { formatTimestamp } from '@/utils/helpers';

interface ChatMessageProps {
  message: ChatMessage;
  className?: string;
}

export default function ChatMessageComponent({ message, className = "" }: ChatMessageProps) {
  const isBot = message.isBot;
  
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 ${className}`}>
      <div className={`max-w-[80%] ${isBot ? 'order-2' : 'order-1'}`}>
        {/* Avatar */}
        <div className={`flex items-end gap-2 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
            isBot ? 'bg-blue-500' : 'bg-gray-500'
          }`}>
            {isBot ? '🤖' : '👤'}
          </div>
          
          {/* Message Bubble */}
          <div className={`rounded-lg px-4 py-2 max-w-full ${
            isBot 
              ? 'bg-white border border-gray-200 text-gray-800' 
              : 'bg-blue-500 text-white'
          }`}>
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </div>
            
            {/* Timestamp */}
            <div className={`text-xs mt-1 ${
              isBot ? 'text-gray-500' : 'text-blue-100'
            }`}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
        
        {/* Message Type Indicator */}
        {message.type && (
          <div className={`text-xs text-gray-500 mt-1 ${isBot ? 'ml-10' : 'mr-10 text-right'}`}>
            {getTypeLabel(message.type)}
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(type: ChatMessage['type']): string {
  switch (type) {
    case 'greeting':
      return 'Welcome message';
    case 'question':
      return 'Question';
    case 'confirmation':
      return 'Confirmation';
    case 'summary':
      return 'Summary';
    default:
      return '';
  }
}
