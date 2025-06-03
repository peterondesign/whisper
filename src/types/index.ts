export type AppState = 'splash' | 'waiting' | 'listening' | 'processing' | 'conversations';

export interface Conversation {
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  position?: [number, number, number]; // 3D position for particle
}

export interface ParticleSystemProps {
  state: AppState;
  isListening: boolean;
  conversations: Conversation[];
}

export interface VoiceHandlerProps {
  onStart: () => void;
  onEnd: (transcript: string) => void;
  onResponse: (response: string) => void;
}
