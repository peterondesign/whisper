export interface Moment {
  id: string;
  description: string;
  location?: string;
  emotion?: string;
  timestamp: Date;
  confirmed: boolean;
}

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  type?: 'greeting' | 'question' | 'confirmation' | 'summary';
}

export type ChatbotState = 
  | 'greeting'
  | 'collecting_moments'
  | 'selecting_moment'
  | 'asking_location'
  | 'asking_emotion'
  | 'summarizing'
  | 'complete';

export interface ChatbotContext {
  state: ChatbotState;
  moments: Moment[];
  selectedMoment?: Moment;
  currentMomentIndex: number;
  totalMomentsToCollect: number;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  confidence: number;
  isSupported: boolean;
}
