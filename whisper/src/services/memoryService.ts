import { MemoryFragment, ConversationMemory, Moment } from '@/types';

export class MemoryService {
  private static instance: MemoryService;

  static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  createEmptyMemory(): ConversationMemory {
    return {
      fragments: [],
      buildingMoments: [],
      totalConversationTime: 0
    };
  }

  addMemoryFragments(memory: ConversationMemory, fragments: MemoryFragment[]): ConversationMemory {
    return {
      ...memory,
      fragments: [...memory.fragments, ...fragments]
    };
  }

  addMemoryFragment(memory: ConversationMemory, fragment: MemoryFragment): ConversationMemory {
    return {
      ...memory,
      fragments: [...memory.fragments, fragment]
    };
  }

  startFreeConversation(memory: ConversationMemory): ConversationMemory {
    return {
      ...memory,
      freeConversationStartTime: new Date()
    };
  }

  buildMomentsFromFragments(memory: ConversationMemory): Partial<Moment>[] {
    const momentCandidates: Map<string, Partial<Moment>> = new Map();
    
    // Group fragments by their potential moments
    // This is a simplified algorithm - in practice, you'd use more sophisticated clustering
    memory.fragments.forEach(fragment => {
      const key = this.generateMomentKey(fragment, memory.fragments);
      
      if (!momentCandidates.has(key)) {
        momentCandidates.set(key, {
          id: this.generateId(),
          description: '',
          timestamp: new Date(),
          confirmed: false
        });
      }
      
      const moment = momentCandidates.get(key)!;
      this.addFragmentToMoment(moment, fragment);
    });
    
    return Array.from(momentCandidates.values()).filter(moment => 
      moment.description || moment.location || moment.action || moment.emotion
    );
  }

  private generateMomentKey(fragment: MemoryFragment, allFragments: MemoryFragment[]): string {
    // Simple clustering based on temporal proximity and content similarity
    // In a real implementation, you'd use more sophisticated NLP techniques
    
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const relatedFragments = allFragments.filter(f => 
      Math.abs(f.timestamp.getTime() - fragment.timestamp.getTime()) < timeWindow
    );
    
    // Create a key based on the most common content themes
    const contentWords = fragment.content.toLowerCase().split(' ');
    const keyWords = contentWords.slice(0, 2).join('-');
    
    return `${Math.floor(fragment.timestamp.getTime() / timeWindow)}-${keyWords}`;
  }

  private addFragmentToMoment(moment: Partial<Moment>, fragment: MemoryFragment): void {
    switch (fragment.type) {
      case 'location':
        if (!moment.location || fragment.confidence > 0.7) {
          moment.location = fragment.content;
        }
        break;
      case 'action':
        if (!moment.action || fragment.confidence > 0.7) {
          moment.action = fragment.content;
        }
        if (!moment.description) {
          moment.description = fragment.content;
        }
        break;
      case 'thinking':
        if (!moment.thinking || fragment.confidence > 0.7) {
          moment.thinking = fragment.content;
        }
        break;
      case 'emotion':
        if (!moment.emotion || fragment.confidence > 0.7) {
          moment.emotion = fragment.content;
        }
        break;
      case 'dialogue':
        if (!moment.dialogue || fragment.confidence > 0.7) {
          moment.dialogue = fragment.content;
        }
        break;
      case 'context':
        if (!moment.description || fragment.confidence > 0.8) {
          moment.description = fragment.content;
        }
        break;
    }
  }

  getMemoryInsights(memory: ConversationMemory): {
    totalFragments: number;
    fragmentsByType: Record<string, number>;
    averageConfidence: number;
    timeSpan: number;
    buildingMoments: number;
  } {
    const fragmentsByType = memory.fragments.reduce((acc, fragment) => {
      acc[fragment.type] = (acc[fragment.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageConfidence = memory.fragments.length > 0
      ? memory.fragments.reduce((sum, f) => sum + f.confidence, 0) / memory.fragments.length
      : 0;

    const timeSpan = memory.fragments.length > 0
      ? Math.max(...memory.fragments.map(f => f.timestamp.getTime())) - 
        Math.min(...memory.fragments.map(f => f.timestamp.getTime()))
      : 0;

    return {
      totalFragments: memory.fragments.length,
      fragmentsByType,
      averageConfidence,
      timeSpan,
      buildingMoments: memory.buildingMoments.length
    };
  }

  exportMemoryAsText(memory: ConversationMemory): string {
    const insights = this.getMemoryInsights(memory);
    
    let report = `CONVERSATION MEMORY REPORT\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;
    
    report += `STATISTICS:\n`;
    report += `- Total fragments: ${insights.totalFragments}\n`;
    report += `- Average confidence: ${(insights.averageConfidence * 100).toFixed(1)}%\n`;
    report += `- Time span: ${Math.round(insights.timeSpan / 1000)}s\n`;
    report += `- Building moments: ${insights.buildingMoments}\n\n`;
    
    report += `FRAGMENTS BY TYPE:\n`;
    Object.entries(insights.fragmentsByType).forEach(([type, count]) => {
      report += `- ${type}: ${count}\n`;
    });
    
    report += `\nMEMORY FRAGMENTS:\n`;
    memory.fragments.forEach((fragment, index) => {
      report += `${index + 1}. [${fragment.type.toUpperCase()}] ${fragment.content} (${(fragment.confidence * 100).toFixed(0)}%)\n`;
    });
    
    if (memory.buildingMoments.length > 0) {
      report += `\nBUILDING MOMENTS:\n`;
      memory.buildingMoments.forEach((moment, index) => {
        report += `${index + 1}. ${moment.description}\n`;
        if (moment.location) report += `   Location: ${moment.location}\n`;
        if (moment.action) report += `   Action: ${moment.action}\n`;
        if (moment.thinking) report += `   Thinking: ${moment.thinking}\n`;
        if (moment.emotion) report += `   Emotion: ${moment.emotion}\n`;
        if (moment.dialogue) report += `   Dialogue: ${moment.dialogue}\n`;
      });
    }
    
    return report;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
