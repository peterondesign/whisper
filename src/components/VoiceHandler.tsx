'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import WaveformVisualizer from '@/components/WaveformVisualizer';

export interface VoiceHandlerProps {
  onStart: () => void;
  onEnd: (transcript: string) => void;
  onResponse: (response: string) => void;
  theme?: 'light' | 'dark';
  continueMode?: boolean;
}

export default function VoiceHandler({ onStart, onEnd, onResponse, theme = 'dark', continueMode = false }: VoiceHandlerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [silenceTimeout, setSilenceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [vadEnabled, setVadEnabled] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const initRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const lastVoiceTimeRef = useRef<number>(0);
  const speechConfidenceRef = useRef<number>(0);
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  // Enhanced Voice Activity Detection parameters  
  const VOICE_START_THRESHOLD = -35; // dB threshold for detecting voice start
  const SPEECH_CONFIDENCE_THRESHOLD = 3; // Number of consecutive voice detections to confirm speech
  const SHORT_PAUSE_DURATION = 800; // Allow short pauses (ms) during natural speech
  const LONG_SILENCE_DURATION = 2500; // Stop after longer silence (ms)
  const MIN_SPEECH_DURATION = 500; // Minimum speech duration before allowing stop (ms)

  // Enhanced Voice Activity Detection
  const startVoiceActivityDetection = useCallback(async (): Promise<void> => {
    try {
      if (!streamRef.current || !vadEnabled) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext as typeof AudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(streamRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let consecutiveVoiceDetections = 0;
      let speechStartTime = 0;

      const checkAudioLevel = () => {
        if (!analyserRef.current || !vadEnabled) return;

        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume in dB
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const volume = average > 0 ? 20 * Math.log10(average / 255) : -Infinity;

        const isCurrentlyActive = volume > VOICE_START_THRESHOLD;
        const currentTime = Date.now();
        
        if (isCurrentlyActive) {
          consecutiveVoiceDetections++;
          lastVoiceTimeRef.current = currentTime;
          
          // Start listening if we have enough confidence and aren't already listening
          if (consecutiveVoiceDetections >= SPEECH_CONFIDENCE_THRESHOLD && !isListening && !isProcessing) {
            speechStartTime = currentTime;
            // Directly call recording start to avoid circular dependency
            if (startRecordingRef.current) {
              startRecordingRef.current();
            }
          }
          
          // Clear any existing silence timeout
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
            setSilenceTimeout(null);
          }
        } else {
          consecutiveVoiceDetections = 0;
          
          // Only trigger silence timeout if we've been listening and had actual speech
          if (isListening && speechStartTime > 0) {
            const speechDuration = currentTime - speechStartTime;
            const silenceDuration = currentTime - lastVoiceTimeRef.current;
            
            // Use different thresholds based on context
            const shouldStop = speechDuration > MIN_SPEECH_DURATION && 
                             (silenceDuration > LONG_SILENCE_DURATION || 
                              (finalTranscriptRef.current.trim().length > 10 && silenceDuration > SHORT_PAUSE_DURATION));
            
            if (shouldStop && !silenceTimeout) {
              const timeoutId = setTimeout(() => {
                if (isListening && finalTranscriptRef.current.trim()) {
                  if (stopListeningRef.current) {
                    stopListeningRef.current();
                  }
                  speechStartTime = 0;
                }
              }, 100); // Small delay to avoid race conditions
              
              setSilenceTimeout(timeoutId);
            }
          }
        }

        setIsVoiceActive(isCurrentlyActive);
        speechConfidenceRef.current = consecutiveVoiceDetections;

        if (vadEnabled) {
          animationFrameRef.current = requestAnimationFrame(checkAudioLevel);
        }
      };

      checkAudioLevel();
    } catch (error) {
      console.error('Voice activity detection error:', error);
      setError('Voice detection failed. Using manual mode.');
      setVadEnabled(false);
    }
  }, [vadEnabled, isListening, isProcessing, silenceTimeout, VOICE_START_THRESHOLD, SPEECH_CONFIDENCE_THRESHOLD, MIN_SPEECH_DURATION, LONG_SILENCE_DURATION, SHORT_PAUSE_DURATION]);

  // Enhanced speech synthesis
  const speakText = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API failed with status ${response.status}`);
      }

      // Play ElevenLabs audio using simple HTML5 Audio
      const audioBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Speech error:', error);
      setError('Voice synthesis temporarily unavailable. Using browser voice.');
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        (window.speechSynthesis as SpeechSynthesis).speak(utterance);
      }
    }
  }, []);

  // Send message to AI
  const handleSendToAI = useCallback(async (userMessage: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      
      if (data.response) {
        onResponse(data.response);
        await speakText(data.response);
      }
    } catch (error) {
      console.error('AI API error:', error);
      const errorMsg = "I'm sorry, I'm having trouble processing that right now.";
      onResponse(errorMsg);
      await speakText(errorMsg);
    }
  }, [onResponse, speakText]);

  // Transcribe audio with Whisper
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const formData = new FormData();
      const extension = audioBlob.type.includes('webm') ? 'webm' : 'wav';
      formData.append('audio', audioBlob, 'recording.' + extension);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed: ' + response.status);
      }

      const data = await response.json();
      
      if (data.success && data.transcript) {
        setTranscript(data.transcript);
        onEnd(data.transcript);
        await handleSendToAI(data.transcript);
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setError('Could not transcribe audio. Try typing instead.');
      setShowTextInput(true);
    } finally {
      setIsProcessing(false);
    }
  }, [onEnd, handleSendToAI]);

  // Cleanup recording resources and VAD
  const cleanupRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      setSilenceTimeout(null);
    }
  }, [silenceTimeout]);

  // Core recording function (used by both manual and VAD)
  const startRecording = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      // Use existing stream if available (VAD mode), otherwise get new stream
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 44100,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          } 
        });
        streamRef.current = stream;
      }
      
      audioChunksRef.current = [];
      finalTranscriptRef.current = '';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        transcribeAudio(audioBlob);
        if (!vadEnabled) {
          cleanupRecording();
        }
      };

      mediaRecorder.start();
      setIsListening(true);
      setTranscript('');
      onStart();

    } catch (error) {
      console.error('Recording error:', error);
      setError('Microphone access denied. Try typing instead.');
      setShowTextInput(true);
    }
  }, [transcribeAudio, onStart, cleanupRecording, vadEnabled]);

  // Start listening with VAD integration
  const startListening = useCallback(async (): Promise<void> => {
    if (vadEnabled) {
      // In VAD mode, just start recording since stream is already available
      await startRecording();
    } else {
      // In manual mode, get fresh stream and start recording
      await startRecording();
    }
  }, [startRecording, vadEnabled]);

  // Update refs when functions change
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  // Stop recording and cleanup VAD
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
    
    // Cleanup VAD
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      setSilenceTimeout(null);
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [isListening, silenceTimeout]);

  // Update refs when functions change
  useEffect(() => {
    stopListeningRef.current = stopListening;
  }, [stopListening]);

  // Handle text input
  const handleTextSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      setTranscript(textInput);
      setShowTextInput(false);
      onEnd(textInput);
      handleSendToAI(textInput);
      setTextInput('');
    }
  }, [textInput, onEnd, handleSendToAI]);

  // Initialize microphone support
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    
    const checkSupport = async () => {
      try {
        if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
          setIsSupported(true);
        } else {
          setIsSupported(false);
          setShowTextInput(true);
        }
      } catch (error) {
        console.error('Media device check failed:', error);
        setIsSupported(false);
        setShowTextInput(true);
      }
    };

    checkSupport();

    return () => {
      cleanupRecording();
    };
  }, [cleanupRecording]);

  // Initialize VAD when enabled and stream is available
  useEffect(() => {
    if (vadEnabled && streamRef.current && !isListening) {
      // Setup continuous monitoring stream for VAD
      const initVADStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              sampleRate: 44100,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
            } 
          });
          
          streamRef.current = stream;
          startVoiceActivityDetection();
        } catch (error) {
          console.error('VAD stream initialization failed:', error);
          setError('Voice detection setup failed. Using manual mode.');
          setVadEnabled(false);
        }
      };

      initVADStream();
    } else if (!vadEnabled && streamRef.current && !isListening) {
      // Cleanup VAD stream when disabled
      cleanupRecording();
    }
  }, [vadEnabled, startVoiceActivityDetection, cleanupRecording, isListening]);

  // --- Web Speech API: Live Transcript Logic with VAD Integration ---
  useEffect(() => {
    if (!isListening) {
      setLiveTranscript('');
      finalTranscriptRef.current = '';
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }
    
    // Browser compatibility
    const SpeechRecognitionCtor = (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition || (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    
    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      
      // Update references for VAD
      if (final) {
        finalTranscriptRef.current += final;
      }
      
      setLiveTranscript(finalTranscriptRef.current + interim);
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setError('Speech recognition error: ' + event.error);
      }
    };
    
    recognition.onend = () => {
      // Auto-restart if still listening (unless VAD is handling it)
      if (isListening && !vadEnabled && recognitionRef.current) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to restart speech recognition:', error);
        }
      }
    };
    
    recognition.start();
    
    return () => {
      recognition.stop();
    };
  }, [isListening, vadEnabled]);

  const textColorClass = theme === 'light' ? 'text-gray-900' : 'text-white';
  const buttonColorClass = theme === 'light' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-800 hover:bg-gray-700';

  return (
    <div className="text-center space-y-6">
      {/* Transcript Display */}
      {transcript && (
        <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-100 border border-gray-200' : 'bg-white/10 backdrop-blur-sm'}`}>
          <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>You said:</p>
          <p className={textColorClass}>{transcript}</p>
        </div>
      )}
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-800/70 backdrop-blur-sm border border-gray-700'}`}>
          <p className={`${theme === 'light' ? 'text-blue-700' : 'text-gray-300'}`}>Processing with Whisper...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-orange-50 border border-orange-200' : 'bg-red-900/20 backdrop-blur-sm border border-red-800'}`}>
          <p className={`${theme === 'light' ? 'text-orange-700' : 'text-red-300'}`}>{error}</p>
        </div>
      )}

      {/* Voice Interface with VAD Toggle */}
      {isSupported && !showTextInput && (
        <div className="flex flex-col items-center space-y-4">
         

          {/* Voice Activity Indicator */}
          {vadEnabled && isVoiceActive && (
            <div className="flex items-center space-x-2 text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs">Voice detected</span>
            </div>
          )}

          <button
            onClick={vadEnabled ? undefined : (isListening ? stopListening : startListening)}
            disabled={isProcessing || (vadEnabled && !streamRef.current)}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50'
                : isProcessing
                ? 'bg-yellow-500 cursor-not-allowed'
                : vadEnabled
                ? 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/50'
                : buttonColorClass + ' shadow-lg'
            } text-white ${vadEnabled && !streamRef.current ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {isListening ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3zm-1 16.93c-3.93-.5-7-3.92-7-7.93h1.5c0 3.03 2.47 5.5 5.5 5.5s5.5-2.47 5.5-5.5H18c0 4.01-3.07 7.43-7 7.93V19h4v1.5H8V19h3v-1.07z"/>
              </svg>
            ) : isProcessing ? (
              <svg className="w-8 h-8 animate-spin" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            ) : vadEnabled ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3zm5.5 9c0 3.03-2.47 5.5-5.5 5.5S6 13.03 6 10H4.5c0 4.01 3.07 7.43 7 7.93V19h-3v1.5h8V19h-3v-1.07c3.93-.5 7-3.92 7-7.93H17.5z"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1c-1.66 0-3 1.34-3 3v6c0 1.66 1.34 3 3 3s3-1.34 3-3V4c0-1.66-1.34-3-3-3zm5.5 9c0 3.03-2.47 5.5-5.5 5.5S6 13.03 6 10H4.5c0 4.01 3.07 7.43 7 7.93V19h-3v1.5h8V19h-3v-1.07c3.93-.5 7-3.92 7-7.93H17.5z"/>
              </svg>
            )}
          </button>
          
          <div className="text-center">
            <p className={`font-medium ${textColorClass}`}>
              {isProcessing ? 'Processing...' : 
               isListening ? 'Listening...' : 
               vadEnabled ? 'Voice detection active' :
               continueMode ? 'Continue conversation' : 'Tap to speak'}
            </p>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              {isProcessing ? 'Transcribing...' : 
               isListening ? (vadEnabled ? 'Automatic stop' : 'Tap when done') : 
               vadEnabled ? 'Hands-free mode' :
               'Powered by Whisper & ElevenLabs'}
            </p>
          </div>
          
          <button
            onClick={() => setShowTextInput(true)}
            className={`text-sm px-3 py-1 rounded-full ${theme === 'light' ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-400 hover:bg-white/10'} transition-colors`}
          >
            Type instead
          </button>
        </div>
        
      )}

       {/* VAD Toggle */}
          <div className="flex items-center text-center mx-auto w-full space-x-3 mb-2">
            <label className={`text-sm ${textColorClass}`}>
              Voice Detection:
            </label>
            <button
              onClick={() => setVadEnabled(!vadEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                vadEnabled
                  ? 'bg-green-600 focus:ring-green-500'
                  : theme === 'light'
                  ? 'bg-gray-300 focus:ring-gray-500'
                  : 'bg-gray-600 focus:ring-gray-500'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  vadEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              {vadEnabled ? 'Auto' : 'Manual'}
            </span>
          </div>

      {/* Text Input Interface */}
      {showTextInput && (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your message here..."
            className={`w-full px-4 py-3 rounded-lg transition-all focus:outline-none focus:ring-2 ${
              theme === 'light'
                ? 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
                : 'bg-gray-800/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-gray-500'
            }`}
            autoFocus
          />
          <div className="flex justify-center space-x-3">
            <button
              type="submit"
              disabled={!textInput.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                textInput.trim()
                  ? buttonColorClass + ' text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Send
            </button>
            {isSupported && (
              <button
                type="button"
                onClick={() => setShowTextInput(false)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                Use Voice
              </button>
            )}
          </div>
        </form>
      )}

      {/* Waveform Visualizer */}
      {isListening && (
        <WaveformVisualizer isActive={isListening} />
      )}

      {/* Live Transcript Display */}
      {isListening && (
        <div className={`mt-4 p-2 rounded text-center text-lg min-h-[2.5rem] ${
          theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-gray-800 text-gray-200'
        }`}>
          {liveTranscript || <span className="text-gray-400">Listening...</span>}
        </div>
      )}
    </div>
  );
}
