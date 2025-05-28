'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceRecognitionState } from '@/types';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useVoiceRecognition = () => {
  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    transcript: '',
    confidence: 0,
    isSupported: false,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const currentLanguageRef = useRef('');

  // Function to detect the best supported language
  const detectSupportedLanguage = useCallback(async (): Promise<string | null> => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    // Extended list of language codes to try, starting with most common
    const languageCodes = [
      'en-US',     // US English (most widely supported)
      'en',        // Generic English
      'en-GB',     // British English
      'en-CA',     // Canadian English
      'en-AU',     // Australian English
      'en-IN',     // Indian English
      'en-ZA',     // South African English
    ];

    // First, try to get the user's preferred language
    const userLanguage = navigator.language || 'en-US';
    if (userLanguage.startsWith('en') && !languageCodes.includes(userLanguage)) {
      languageCodes.unshift(userLanguage);
    }

    // Test each language by actually attempting to start recognition
    for (const lang of languageCodes) {
      try {
        const testRecognition = new SpeechRecognition();
        testRecognition.lang = lang;
        testRecognition.continuous = false;
        testRecognition.interimResults = false;
        
        // Create a promise to test if the language works
        const isSupported = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => {
            testRecognition.abort();
            resolve(false);
          }, 100);

          testRecognition.onerror = (event) => {
            clearTimeout(timeout);
            if (event.error === 'language-not-supported') {
              resolve(false);
            } else {
              // Other errors don't necessarily mean the language isn't supported
              resolve(true);
            }
          };

          testRecognition.onstart = () => {
            clearTimeout(timeout);
            testRecognition.abort();
            resolve(true);
          };

          try {
            testRecognition.start();
          } catch {
            clearTimeout(timeout);
            resolve(false);
          }
        });

        if (isSupported) {
          console.log(`✅ Speech recognition language supported: ${lang}`);
          return lang;
        } else {
          console.log(`❌ Language not supported: ${lang}`);
        }
      } catch (error) {
        console.log(`❌ Language test failed: ${lang}`, error);
        continue;
      }
    }

    console.warn('No supported speech recognition language found');
    return null;
  }, []);

  // Initialize speech recognition with proper language detection
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('Speech recognition not available in this browser');
        setState(prev => ({ ...prev, isSupported: false }));
        return;
      }

      try {
        // Detect supported language first
        let supportedLanguage = await detectSupportedLanguage();
        
        // If no language was detected as supported, fallback to 'en-US' and let the user handle any errors
        if (!supportedLanguage) {
          console.warn('No supported speech recognition language detected, falling back to en-US');
          supportedLanguage = 'en-US';
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = supportedLanguage;
        currentLanguageRef.current = supportedLanguage;

        console.log(`🎤 Speech recognition initialized with language: ${supportedLanguage}`);

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = '';
          let finalTranscript = finalTranscriptRef.current;

          for (let i = event.results.length - 1; i >= 0; i--) {
            const result = event.results[i];
            if (result[0]) {
              if (result.isFinal) {
                finalTranscript += result[0].transcript;
              } else {
                interimTranscript = result[0].transcript;
              }
            }
          }

          finalTranscriptRef.current = finalTranscript;
          const fullTranscript = finalTranscript + interimTranscript;

          setState(prev => ({
            ...prev,
            transcript: fullTranscript,
            confidence: event.results[event.results.length - 1]?.[0]?.confidence || 0,
          }));
        };

        recognition.onerror = (event) => {
          console.warn(`🚫 Speech recognition error: ${event.error}`);
          
          // Handle different error types
          switch (event.error) {
            case 'language-not-supported':
              console.error('Language not supported:', currentLanguageRef.current);
              // Try to switch to a fallback language
              if (currentLanguageRef.current !== 'en-US') {
                console.log('Attempting fallback to en-US...');
                recognition.lang = 'en-US';
                currentLanguageRef.current = 'en-US';
                // Don't set isSupported to false immediately, let it try again
              } else {
                setState(prev => ({ 
                  ...prev, 
                  isSupported: false, 
                  isListening: false 
                }));
              }
              break;
              
            case 'not-allowed':
              console.error('Microphone access denied');
              setState(prev => ({ 
                ...prev, 
                isSupported: false, 
                isListening: false 
              }));
              break;
              
            case 'no-speech':
              console.log('No speech detected, continuing...');
              // Don't stop listening for no-speech errors
              break;
              
            case 'audio-capture':
              console.error('Audio capture failed');
              setState(prev => ({ ...prev, isListening: false }));
              break;
              
            case 'network':
              console.error('Network error occurred');
              setState(prev => ({ ...prev, isListening: false }));
              break;
              
            default:
              console.error('Unknown speech recognition error:', event.error);
              setState(prev => ({ ...prev, isListening: false }));
          }
        };

        recognition.onend = () => {
          console.log('🛑 Speech recognition ended');
          setState(prev => ({ ...prev, isListening: false }));
        };

        recognition.onstart = () => {
          console.log('🎤 Speech recognition started');
          setState(prev => ({ ...prev, isListening: true }));
        };

        recognitionRef.current = recognition;
        // Mark as supported since we have the API and fallback mechanisms
        setState(prev => ({ ...prev, isSupported: true }));
        
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        setState(prev => ({ ...prev, isSupported: false }));
      }
    };

    initializeSpeechRecognition();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (error) {
          console.warn('Error aborting speech recognition:', error);
        }
      }
    };
  }, [detectSupportedLanguage]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      finalTranscriptRef.current = '';
      setState(prev => ({ ...prev, isListening: true, transcript: '' }));
      recognitionRef.current.start();
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && state.isListening) {
      recognitionRef.current.stop();
    }
  }, [state.isListening]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setState(prev => ({ ...prev, transcript: '', confidence: 0 }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
};
