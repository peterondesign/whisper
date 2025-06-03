import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ConversationMessage {
  timestamp: string;
  userMessage: string;
  aiResponse: string;
}

export interface ConversationSession {
  session_id: string;
  device_id: string;
  started_at: string;
  ended_at?: string | null;
  conversation: ConversationMessage[];
}

// Function to create a new conversation session
export async function createConversationSession(deviceId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_sessions')
      .insert([
        {
          device_id: deviceId,
          conversation: []
        }
      ])
      .select('session_id')
      .single();

    if (error) {
      console.error('Error creating conversation session:', error);
      return null;
    }

    return data.session_id;
  } catch (error) {
    console.error('Error creating conversation session:', error);
    return null;
  }
}

// Function to update conversation session with new messages
export async function updateConversationSession(
  sessionId: string,
  conversation: ConversationMessage[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversation_sessions')
      .update({
        conversation: conversation,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error updating conversation session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating conversation session:', error);
    return false;
  }
}

// Function to end a conversation session
export async function endConversationSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('conversation_sessions')
      .update({
        ended_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error ending conversation session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ending conversation session:', error);
    return false;
  }
}

// Function to get conversation sessions for a device
export async function getConversationSessions(deviceId: string): Promise<ConversationSession[]> {
  try {
    const { data, error } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('device_id', deviceId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversation sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching conversation sessions:', error);
    return [];
  }
}

// Function to generate a device ID (you might want to use a more sophisticated approach)
export function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Function to get or create device ID from localStorage
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return generateDeviceId();
  
  let deviceId = localStorage.getItem('voice_companion_device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('voice_companion_device_id', deviceId);
  }
  return deviceId;
}
