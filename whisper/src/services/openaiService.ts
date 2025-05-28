import { ChatMessage, Moment, ChatbotState } from '@/types';

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

  async generateResponse(
    userMessage: string,
    context: {
      state: ChatbotState;
      moments: Moment[];
      selectedMoment?: Moment;
      previousMessages: ChatMessage[];
    }
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackResponse(userMessage, context);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const messages = this.buildMessageHistory(context.previousMessages, systemPrompt);
      messages.push({ role: 'user', content: userMessage });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 300,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || this.getFallbackResponse(userMessage, context);
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getFallbackResponse(userMessage, context);
    }
  }

  private buildSystemPrompt(context: {
    state: ChatbotState;
    moments: Moment[];
    selectedMoment?: Moment;
  }): string {
    const basePrompt = `You are a compassionate moments tracking chatbot. Your role is to help users capture and reflect on meaningful moments from yesterday. Be warm, empathetic, and encouraging.

Current conversation state: ${context.state}
Moments collected so far: ${context.moments.length}
Selected moment: ${context.selectedMoment ? 'Yes' : 'No'}

Guidelines:
- Keep responses concise (1-3 sentences)
- Be naturally conversational and warm
- Ask one question at a time
- Acknowledge what users share before moving to next questions
- If users give brief responses, gently encourage more detail
- Use positive, encouraging language
- Maintain context from previous interactions`;

    switch (context.state) {
      case 'greeting':
        return basePrompt + `\n\nCurrently: Welcome the user and ask them to share 3 moments from yesterday that stood out to them.`;
      
      case 'collecting_moments':
        return basePrompt + `\n\nCurrently: You're collecting moments. If this is a valid moment description, acknowledge it positively and ask for the next moment. If it's too brief or unclear, gently ask for more details.`;
      
      case 'selecting_moment':
        return basePrompt + `\n\nCurrently: Present the collected moments as a numbered list and ask the user to select one to explore further.`;
      
      case 'asking_location':
        return basePrompt + `\n\nCurrently: Ask where the selected moment took place. Be specific but warm.`;
      
      case 'asking_emotion':
        return basePrompt + `\n\nCurrently: Ask how the moment made them feel or what emotions they experienced.`;
      
      case 'summarizing':
        return basePrompt + `\n\nCurrently: Provide a beautiful summary of their moment including the description, location, and emotions. Ask if this captures it well.`;
      
      default:
        return basePrompt;
    }
  }

  private buildMessageHistory(previousMessages: ChatMessage[], systemPrompt: string): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Include recent conversation history (last 10 messages)
    const recentMessages = previousMessages.slice(-10);
    
    recentMessages.forEach(msg => {
      messages.push({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      });
    });

    return messages;
  }

  private getFallbackResponse(userMessage: string, context: {
    state: ChatbotState;
    moments: Moment[];
    selectedMoment?: Moment;
  }): string {
    // Fallback responses when OpenAI is not available
    switch (context.state) {
      case 'greeting':
        return "Hello! I'm here to help you capture and reflect on meaningful moments from yesterday. Can you share three moments that stood out to you?";
      
      case 'collecting_moments':
        if (context.moments.length === 0) {
          return "Thank you for sharing that moment! That sounds meaningful. Can you tell me about another moment from yesterday?";
        } else if (context.moments.length === 1) {
          return "I've captured that moment. What's another moment from yesterday that you'd like to remember?";
        } else {
          return "Perfect! That's a lovely moment. Can you share one more moment to complete your collection of three?";
        }
      
      case 'selecting_moment':
        return "Here are the three moments you've shared. Which one would you like to explore further? Please choose by saying its number.";
      
      case 'asking_location':
        return "Where did this moment take place?";
      
      case 'asking_emotion':
        return "How did this moment make you feel?";
      
      case 'summarizing':
        return "Here's how I understand your moment. Does this capture it well for you?";
      
      default:
        return "I understand. Please continue sharing with me.";
    }
  }

  async generateMomentTitle(moment: Moment): Promise<string> {
    if (!this.apiKey) {
      return this.generateFallbackTitle(moment);
    }

    try {
      const prompt = `Generate a short, meaningful title (2-6 words) for this moment: "${moment.description}". Make it warm and personal.`;
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You generate short, meaningful titles for personal moments. Keep them warm, personal, and 2-6 words long.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 50,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.replace(/['"]/g, '') || this.generateFallbackTitle(moment);
    } catch (error) {
      console.error('Error generating title:', error);
      return this.generateFallbackTitle(moment);
    }
  }

  private generateFallbackTitle(moment: Moment): string {
    const words = moment.description.split(' ').slice(0, 4);
    return words.join(' ') + (words.length < moment.description.split(' ').length ? '...' : '');
  }
}
