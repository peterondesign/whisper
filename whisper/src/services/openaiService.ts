import { ChatMessage, Moment, ChatbotState, MemoryFragment, ConversationMemory } from '@/types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIService {
  private static instance: OpenAIService;
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_OPEN_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Falling back to mock responses.');
    }
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  async generateProgressiveResponse(
    userMessage: string,
    context: {
      state: ChatbotState;
      moments: Moment[];
      selectedMoment?: Moment;
      previousMessages: ChatMessage[];
      memory?: ConversationMemory;
    }
  ): Promise<{
    response: string;
    memoryFragments?: MemoryFragment[];
    nextState?: ChatbotState;
    detectedMoments?: Partial<Moment>[];
  }> {
    if (!this.apiKey) {
      return this.getFallbackProgressiveResponse(userMessage, context);
    }

    try {
      const systemPrompt = this.buildProgressiveSystemPrompt(context);
      const messages = this.buildMessageHistory(context.previousMessages, systemPrompt);
      messages.push({ role: 'user', content: userMessage });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages,
          max_tokens: 500,
          temperature: 0.8,
          presence_penalty: 0.2,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || this.getFallbackResponse(userMessage, context);
      
      // Parse the response for memory fragments and state changes
      const result = await this.parseProgressiveResponse(aiResponse, userMessage, context);
      
      return {
        response: result.cleanResponse,
        memoryFragments: result.memoryFragments,
        nextState: result.nextState,
        detectedMoments: result.detectedMoments
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackProgressiveResponse(userMessage, context);
    }
  }

  private buildProgressiveSystemPrompt(context: {
    state: ChatbotState;
    moments: Moment[];
    selectedMoment?: Moment;
    memory?: ConversationMemory;
  }): string {
    const basePrompt = `You are Splatter, an intelligent, empathetic moments-tracking chatbot. Your goal is to help users capture rich, detailed memories by having natural conversations.

CORE CAPABILITIES:
1. PROGRESSIVE MEMORY BUILDING: Extract and store memory fragments (location, action, thinking, emotion, dialogue) from natural conversation
2. INTELLIGENT CONVERSATION: Adapt your responses based on what you've learned
3. MOMENT ENHANCEMENT: Help users build complete, rich moments with all 5 fields: location, action, thinking, emotion, dialogue
4. FREE-FORM MODE: Support 5-minute open conversations while continuously building memories

CURRENT STATE: ${context.state}
MOMENTS COLLECTED: ${context.moments.length}
MEMORY FRAGMENTS: ${context.memory?.fragments.length || 0}

RESPONSE GUIDELINES:
- Be warm, natural, and conversational
- Ask follow-up questions that naturally extract memory details
- Don't be clinical or robotic - chat like a friend who's genuinely interested
- Extract information progressively, not through rigid Q&A
- Use what you've learned to personalize responses
- When you identify memory fragments, note them in [MEMORY:type:content] format
- When ready to change state, use [STATE:new_state] format

MEMORY EXTRACTION:
- LOCATION: Where things happened (be specific)
- ACTION: What the user actually did (physical actions, activities)
- THINKING: Their thoughts, reflections, mental state
- EMOTION: How they felt (specific emotions, not just "good/bad")
- DIALOGUE: What was said, conversations, quotes`;

    switch (context.state) {
      case 'greeting':
        return basePrompt + `\n\nCURRENT TASK: Welcome the user warmly and start a natural conversation about their recent experiences. Ask about moments from yesterday in a conversational way.`;
      
      case 'collecting_moments':
        return basePrompt + `\n\nCURRENT TASK: Have a natural conversation to collect 3 meaningful moments. Don't interrogate - chat naturally and let moments emerge. Use [MEMORY:] tags to capture details as they come up.`;
      
      case 'free_conversation':
        return basePrompt + `\n\nCURRENT TASK: Have an open, 5-minute conversation. Build memories naturally while being genuinely interested in their experiences. Don't focus on structured moment collection - just be present and engaged.`;
      
      case 'selecting_moment':
        return basePrompt + `\n\nCURRENT TASK: Help user choose which moment to explore deeper. Present options naturally and enthusiastically.`;
      
      case 'asking_location':
      case 'asking_action':
      case 'asking_thinking':
      case 'asking_emotion':
      case 'asking_dialogue':
        const fieldMap = {
          asking_location: 'location details',
          asking_action: 'specific actions and activities',
          asking_thinking: 'thoughts and mental reflections',
          asking_emotion: 'emotions and feelings',
          asking_dialogue: 'conversations and dialogue'
        };
        return basePrompt + `\n\nCURRENT TASK: Naturally gather ${fieldMap[context.state]} about the selected moment. Don't ask directly - create a conversation that draws out these details.`;
      
      default:
        return basePrompt + `\n\nCURRENT TASK: Continue the natural conversation and adapt to what the user needs.`;
    }
  }

  private async parseProgressiveResponse(
    aiResponse: string, 
    userMessage: string, 
    context: any
  ): Promise<{
    cleanResponse: string;
    memoryFragments: MemoryFragment[];
    nextState?: ChatbotState;
    detectedMoments?: Partial<Moment>[];
  }> {
    const memoryFragments: MemoryFragment[] = [];
    let nextState: ChatbotState | undefined;
    const detectedMoments: Partial<Moment>[] = [];
    
    // Extract memory fragments
    const memoryRegex = /\[MEMORY:(location|action|thinking|emotion|dialogue|context):([^\]]+)\]/g;
    let match;
    while ((match = memoryRegex.exec(aiResponse)) !== null) {
      memoryFragments.push({
        id: this.generateId(),
        type: match[1] as any,
        content: match[2].trim(),
        confidence: 0.8,
        timestamp: new Date(),
      });
    }
    
    // Extract state changes
    const stateRegex = /\[STATE:([^\]]+)\]/;
    const stateMatch = aiResponse.match(stateRegex);
    if (stateMatch) {
      nextState = stateMatch[1] as ChatbotState;
    }
    
    // Clean response of markup
    const cleanResponse = aiResponse
      .replace(/\[MEMORY:[^\]]+\]/g, '')
      .replace(/\[STATE:[^\]]+\]/g, '')
      .trim();
    
    return {
      cleanResponse,
      memoryFragments,
      nextState,
      detectedMoments
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getFallbackProgressiveResponse(
    userMessage: string,
    context: { state: ChatbotState }
  ): {
    response: string;
    memoryFragments?: MemoryFragment[];
    nextState?: ChatbotState;
    detectedMoments?: Partial<Moment>[];
  } {
    // Fallback responses when OpenAI is not available
    const fallbackResponses: Record<ChatbotState, string> = {
      greeting: "Hi there! I'm Splatter, and I'd love to hear about your day yesterday. What's something that stood out to you?",
      collecting_moments: "That sounds interesting! Tell me more about that experience.",
      free_conversation: "I'm here to listen. What's on your mind?",
      selecting_moment: "Which moment would you like to explore?",
      asking_location: "Where did this happen?",
      asking_action: "What exactly did you do?",
      asking_thinking: "What was going through your mind?",
      asking_emotion: "How did that make you feel?",
      asking_dialogue: "Was there anything said that you remember?",
      summarizing: "Let me summarize what we've captured.",
      complete: "Thank you for sharing these moments with me."
    };

    return {
      response: fallbackResponses[context.state] || "Tell me more about that.",
      memoryFragments: [],
    };
  }

  // Legacy method for backward compatibility
  async generateResponse(
    userMessage: string,
    context: {
      state: ChatbotState;
      moments: Moment[];
      selectedMoment?: Moment;
      previousMessages: ChatMessage[];
    }
  ): Promise<string> {
    const result = await this.generateProgressiveResponse(userMessage, context);
    return result.response;
  }

  private buildSystemPrompt(context: {
    state: ChatbotState;
    moments: Moment[];
    selectedMoment?: Moment;
  }): string {
    // Legacy method - use buildProgressiveSystemPrompt instead
    return this.buildProgressiveSystemPrompt(context);
  }

  private buildMessageHistory(previousMessages: ChatMessage[], systemPrompt: string): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Include last 10 messages for context
    const recentMessages = previousMessages.slice(-10);
    
    for (const msg of recentMessages) {
      messages.push({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      });
    }
    
    return messages;
  }

  private getFallbackResponse(userMessage: string, context: {
    state: ChatbotState;
    moments: Moment[];
    selectedMoment?: Moment;
  }): string {
    // Simple fallback responses when OpenAI is not available
    const fallbackResponses = {
      greeting: "Hello! I'm here to help you capture meaningful moments. What happened yesterday that you'd like to remember?",
      collecting_moments: "That sounds like an interesting moment. Can you tell me more about it?",
      selecting_moment: "Which of these moments would you like to explore further?",
      asking_location: "Where did this moment take place?",
      asking_action: "What exactly did you do during this moment?",
      asking_thinking: "What were you thinking about during this experience?", 
      asking_emotion: "How did this moment make you feel?",
      asking_dialogue: "Was there any conversation or dialogue during this moment?",
      free_conversation: "I'm listening. What would you like to talk about?",
      summarizing: "Let me summarize what we've discussed about this moment.",
      complete: "Thank you for sharing these meaningful moments with me."
    };

    return fallbackResponses[context.state] || "Tell me more about that.";
  }

  async generateMomentTitle(moment: Moment): Promise<string> {
    if (!this.apiKey) {
      return this.generateFallbackTitle(moment);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates short, meaningful titles for personal moments. Keep titles under 6 words and capture the essence of the moment.'
            },
            {
              role: 'user',
              content: `Create a short title for this moment: ${moment.description}${moment.location ? ` at ${moment.location}` : ''}${moment.emotion ? ` (felt ${moment.emotion})` : ''}`
            }
          ],
          max_tokens: 20,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.replace(/['"]/g, '') || this.generateFallbackTitle(moment);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.generateFallbackTitle(moment);
    }
  }

  private generateFallbackTitle(moment: Moment): string {
    const words = moment.description.split(' ').slice(0, 4);
    return words.join(' ') + (words.length < moment.description.split(' ').length ? '...' : '');
  }

  async extractMemoryFragments(text: string): Promise<MemoryFragment[]> {
    if (!this.apiKey) {
      return this.extractMemoryFragmentsFallback(text);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Extract memory fragments from user text. Return a JSON array of objects with:
              - type: "location" | "action" | "thinking" | "emotion" | "dialogue" | "context"
              - content: the extracted content
              - confidence: 0-1 confidence score

              Focus on concrete, specific details. Return empty array if no clear fragments found.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 300,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content;
      
      try {
        const fragments = JSON.parse(result);
        return fragments.map((f: any) => ({
          id: this.generateId(),
          type: f.type,
          content: f.content,
          confidence: f.confidence,
          timestamp: new Date()
        }));
      } catch {
        return this.extractMemoryFragmentsFallback(text);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.extractMemoryFragmentsFallback(text);
    }
  }

  private extractMemoryFragmentsFallback(text: string): MemoryFragment[] {
    const fragments: MemoryFragment[] = [];
    
    // Simple pattern matching for basic memory extraction
    const locationPatterns = /(at|in|on|near|by) ([^.!?]+)/gi;
    const emotionPatterns = /(felt|feeling|was|am) (happy|sad|excited|nervous|angry|peaceful|grateful|frustrated|confused|amazed|disappointed|proud|embarrassed|relieved|anxious)/gi;
    const actionPatterns = /(went|walked|ran|drove|sat|stood|ate|drank|talked|listened|watched|read|wrote|worked|played)/gi;
    
    let match;
    
    // Extract locations
    while ((match = locationPatterns.exec(text)) !== null) {
      fragments.push({
        id: this.generateId(),
        type: 'location',
        content: match[2].trim(),
        confidence: 0.6,
        timestamp: new Date()
      });
    }
    
    // Extract emotions
    while ((match = emotionPatterns.exec(text)) !== null) {
      fragments.push({
        id: this.generateId(),
        type: 'emotion',
        content: match[2].trim(),
        confidence: 0.7,
        timestamp: new Date()
      });
    }
    
    return fragments;
  }
}
