import { extractMomentFromText, isValidMoment, sanitizeInput, getRandomResponseVariation } from '@/utils/helpers';

export class NLPService {
  private static instance: NLPService;

  static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  processUserInput(input: string, context: 'moment' | 'location' | 'emotion' | 'selection'): {
    isValid: boolean;
    processedText: string;
    suggestions?: string[];
    needsClarification?: boolean;
  } {
    const cleaned = sanitizeInput(input);
    
    switch (context) {
      case 'moment':
        return this.processMomentInput(cleaned);
      case 'location':
        return this.processLocationInput(cleaned);
      case 'emotion':
        return this.processEmotionInput(cleaned);
      case 'selection':
        return this.processSelectionInput(cleaned);
      default:
        return { isValid: false, processedText: cleaned };
    }
  }

  private processMomentInput(input: string): {
    isValid: boolean;
    processedText: string;
    suggestions?: string[];
    needsClarification?: boolean;
  } {
    const processed = extractMomentFromText(input);
    const isValid = isValidMoment(processed);
    
    if (!isValid) {
      return {
        isValid: false,
        processedText: processed,
        needsClarification: true,
        suggestions: [
          "Try describing what you did, where you went, or who you met.",
          "Include more details about the experience.",
          "Start with 'I...' or 'We...' to describe the moment."
        ]
      };
    }

    return { isValid: true, processedText: processed };
  }

  private processLocationInput(input: string): {
    isValid: boolean;
    processedText: string;
    suggestions?: string[];
  } {
    const locationKeywords = ['at', 'in', 'on', 'near', 'by', 'home', 'work', 'school', 'park', 'restaurant', 'store'];
    const hasLocationKeyword = locationKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );

    if (input.length < 2) {
      return {
        isValid: false,
        processedText: input,
        suggestions: [
          "Could you be more specific about the location?",
          "Try mentioning a place name or description."
        ]
      };
    }

    // Clean up common location prefixes
    let processed = input;
    const prefixes = /^(at|in|on|near|by)\s+/i;
    processed = processed.replace(prefixes, '');

    return { isValid: true, processedText: processed };
  }

  private processEmotionInput(input: string): {
    isValid: boolean;
    processedText: string;
    suggestions?: string[];
  } {
    const emotionWords = [
      'happy', 'sad', 'excited', 'nervous', 'proud', 'grateful', 'surprised', 
      'content', 'peaceful', 'anxious', 'joyful', 'relieved', 'amazed', 
      'comfortable', 'energetic', 'calm', 'frustrated', 'hopeful'
    ];

    const hasEmotionWord = emotionWords.some(emotion => 
      input.toLowerCase().includes(emotion)
    );

    if (input.length < 3) {
      return {
        isValid: false,
        processedText: input,
        suggestions: [
          "Try describing how you felt in one or more words.",
          "Examples: happy, excited, peaceful, grateful, nervous, etc."
        ]
      };
    }

    // Clean up common emotion prefixes
    let processed = input;
    const prefixes = /^(i felt?|it made me feel|i was|i am)\s+/i;
    processed = processed.replace(prefixes, '');

    return { isValid: true, processedText: processed };
  }

  private processSelectionInput(input: string): {
    isValid: boolean;
    processedText: string;
    suggestions?: string[];
  } {
    // Look for numbers or selection indicators
    const numberMatch = input.match(/(\d+|first|second|third|one|two|three)/i);
    
    if (numberMatch) {
      const numberText = numberMatch[1].toLowerCase();
      let index: number;
      
      switch (numberText) {
        case 'first':
        case 'one':
        case '1':
          index = 0;
          break;
        case 'second':
        case 'two':
        case '2':
          index = 1;
          break;
        case 'third':
        case 'three':
        case '3':
          index = 2;
          break;
        default:
          index = parseInt(numberText) - 1;
      }

      return { isValid: true, processedText: index.toString() };
    }

    return {
      isValid: false,
      processedText: input,
      suggestions: [
        "Please select by saying a number (1, 2, 3) or position (first, second, third)."
      ]
    };
  }

  generateResponse(context: string, data?: any): string {
    const responses = this.getResponseTemplates(context);
    const template = getRandomResponseVariation(responses);
    
    if (data) {
      return this.interpolateTemplate(template, data);
    }
    
    return template;
  }

  private getResponseTemplates(context: string): string[] {
    const templates: Record<string, string[]> = {
      greeting: [
        "Hello! I'm here to help you capture and reflect on meaningful moments from yesterday. Can you share three moments that stood out to you?",
        "Hi there! Let's explore some special moments from yesterday. Could you tell me about three things that happened that you'd like to remember?",
        "Welcome! I'd love to hear about your yesterday. Can you share three moments that were meaningful to you?"
      ],
      momentConfirmed: [
        "Got it! That sounds like a wonderful moment.",
        "Thank you for sharing that. I've captured this moment.",
        "That's a great moment to remember. I've noted it down."
      ],
      needsMoreMoments: [
        "Thank you for that moment. Can you share another moment from yesterday?",
        "That's lovely. Could you tell me about another moment that stood out?",
        "I've got that one. What's another moment you'd like to remember?"
      ],
      allMomentsCollected: [
        "Perfect! I've captured all three of your moments. Here they are:",
        "Wonderful! Here are the three moments you've shared:",
        "Great! Let me show you the moments you've told me about:"
      ],
      selectMoment: [
        "Which of these moments would you like to explore further? Please choose one by saying its number.",
        "I'd love to learn more about one of these moments. Which one would you like to dive deeper into?",
        "Let's explore one of these moments in more detail. Which one speaks to you right now?"
      ],
      askLocation: [
        "Where did this moment happen?",
        "Can you tell me where this took place?",
        "What location comes to mind for this moment?"
      ],
      askEmotion: [
        "How did this moment make you feel?",
        "What emotions did you experience during this moment?",
        "How would you describe your feelings about this moment?"
      ],
      summary: [
        "Here's what I understand about this moment:",
        "Let me summarize this beautiful moment:",
        "This is how I've captured your moment:"
      ],
      confirmSummary: [
        "Does this capture your moment accurately?",
        "Is this how you'd like to remember this moment?",
        "Would you like to add or change anything about this summary?"
      ]
    };

    return templates[context] || ["I understand."];
  }

  private interpolateTemplate(template: string, data: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
  }
}
