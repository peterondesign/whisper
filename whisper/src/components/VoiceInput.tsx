'use client';

import React, { useState, useEffect } from 'react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

interface VoiceInputProps {
  onInput: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function VoiceInput({ 
  onInput, 
  placeholder = "Type your message or click the microphone to speak...", 
  disabled = false,
  className = ""
}: VoiceInputProps) {
  const [textInput, setTextInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const voice = useVoiceRecognition();

  // Update text input when voice recognition provides transcript
  useEffect(() => {
    if (voice.transcript && !isEditing) {
      setTextInput(voice.transcript);
    }
  }, [voice.transcript, isEditing]);

  const handleSend = () => {
    if (textInput.trim()) {
      onInput(textInput.trim());
      setTextInput('');
      voice.resetTranscript();
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    setIsEditing(true);
  };

  const toggleVoiceRecognition = () => {
    if (voice.isListening) {
      voice.stopListening();
      setIsEditing(false);
    } else {
      voice.startListening();
      setIsEditing(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="flex flex-col p-4">
        {/* Voice Recognition Status */}
        {voice.isListening && (
          <div className="mb-2 flex items-center text-sm text-blue-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
            Listening... {voice.confidence > 0 && `(Confidence: ${Math.round(voice.confidence * 100)}%)`}
          </div>
        )}

        {/* Voice Recognition Error/Status Messages */}
        {!voice.isSupported && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Voice recognition not available - you can still type your responses
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="flex gap-2">
          <textarea
            value={textInput}
            onChange={handleTextChange}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          
          {/* Voice Recognition Button */}
          {voice.isSupported && (
            <button
              onClick={toggleVoiceRecognition}
              disabled={disabled}
              className={`p-2 rounded-lg transition-colors ${
                voice.isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              title={voice.isListening ? 'Stop listening' : 'Start voice input'}
            >
              {voice.isListening ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={disabled || !textInput.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
