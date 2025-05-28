import { Moment, ChatMessage } from '@/types';

interface StoredSession {
  id: string;
  moments: Moment[];
  messages: ChatMessage[];
  timestamp: Date;
}

export class StorageService {
  private static instance: StorageService;
  private storageKey = 'moments_chatbot_sessions';

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  saveSession(sessionId: string, moments: Moment[], messages: ChatMessage[]): void {
    if (!this.isClient()) return;

    try {
      const sessions = this.getAllSessions();
      const session: StoredSession = {
        id: sessionId,
        moments,
        messages,
        timestamp: new Date(),
      };

      sessions[sessionId] = session;
      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  loadSession(sessionId: string): StoredSession | null {
    if (!this.isClient()) return null;

    try {
      const sessions = this.getAllSessions();
      const session = sessions[sessionId];
      
      if (session) {
        // Convert timestamp strings back to Date objects
        return {
          ...session,
          timestamp: new Date(session.timestamp),
          moments: session.moments.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })),
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  getAllSessions(): Record<string, StoredSession> {
    if (!this.isClient()) return {};

    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return {};
    }
  }

  deleteSession(sessionId: string): void {
    if (!this.isClient()) return;

    try {
      const sessions = this.getAllSessions();
      delete sessions[sessionId];
      localStorage.setItem(this.storageKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }

  clearAllSessions(): void {
    if (!this.isClient()) return;

    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear sessions:', error);
    }
  }

  exportSession(sessionId: string): string | null {
    const session = this.loadSession(sessionId);
    if (!session) return null;

    try {
      return JSON.stringify(session, null, 2);
    } catch (error) {
      console.error('Failed to export session:', error);
      return null;
    }
  }

  getSessionList(): Array<{ id: string; timestamp: Date; momentCount: number }> {
    const sessions = this.getAllSessions();
    
    return Object.values(sessions)
      .map(session => ({
        id: session.id,
        timestamp: new Date(session.timestamp),
        momentCount: session.moments.length
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
