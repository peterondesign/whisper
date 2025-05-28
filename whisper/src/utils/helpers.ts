export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

export const isValidMoment = (text: string): boolean => {
  const minLength = 10;
  const hasSubjectAndVerb = /\b(I|we|my|our|the)\b.*\b(was|were|went|did|had|got|saw|met|felt)\b/i.test(text);
  return text.length >= minLength && hasSubjectAndVerb;
};

export const extractMomentFromText = (text: string): string => {
  // Simple extraction - in a real app, you might use more sophisticated NLP
  const cleaned = sanitizeInput(text);
  
  // Remove question words if user is answering a question
  const questionWords = /^(well,?|so,?|um,?|uh,?|actually,?|yesterday,?)\s*/i;
  return cleaned.replace(questionWords, '');
};

export const getRandomResponseVariation = (responses: string[]): string => {
  return responses[Math.floor(Math.random() * responses.length)];
};
