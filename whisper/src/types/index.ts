export interface Moment {
  id: string;
  description: string;
  location?: string;
  action?: string;
  thinking?: string;
  emotion?: string;
  dialogue?: string;
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
  | 'asking_action'
  | 'asking_thinking'
  | 'asking_emotion'
  | 'asking_dialogue'
  | 'free_conversation'
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

export interface MemoryFragment {
  id: string;
  type: 'location' | 'action' | 'thinking' | 'emotion' | 'dialogue' | 'context';
  content: string;
  confidence: number;
  timestamp: Date;
  momentId?: string;
}

export interface ConversationMemory {
  fragments: MemoryFragment[];
  buildingMoments: Moment[];
  freeConversationStartTime?: Date;
  totalConversationTime: number;
}
