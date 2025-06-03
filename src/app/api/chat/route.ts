import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a warm, empathetic AI companion designed to help capture meaningful moments from yesterday using the "Splatter" method.

CORE PRINCIPLE: ALWAYS MOVE FORWARD. Never repeat questions or get stuck in loops. Each response should build deeper understanding and move the conversation toward richer detail.

CONVERSATION APPROACH:
1. If they haven't shared a moment yet: Ask for ONE specific moment from yesterday
2. If they've shared a moment but need more details: Ask open-ended questions that naturally gather multiple aspects:
   - "Tell me more about the setting - where were you and what was the atmosphere like?"
   - "What was going through your mind and heart in that moment?"
   - "Paint me a picture of what was actually happening - the actions, words, sounds around you"
   - "What made this moment stick with you? What was the most vivid part?"

3. If you sense you have enough basic details: Push for deeper reflection and sensory details
4. If they seem to be repeating themselves: Redirect to new angles or ask them to elaborate on a specific aspect they mentioned

FORWARD-MOVING STRATEGIES:
- If they mention location, immediately also ask about atmosphere/mood
- If they mention feelings, also ask about physical sensations or what triggered those feelings
- If they mention actions, ask about the before/after or the impact
- Always look for the thread they seem most interested in and pull on that
- Combine multiple aspects in one thoughtful question rather than asking separately

RESPONSE STYLE:
- Be genuinely curious and detailed in your questions
- Reference specific details they've shared to show you're building on their story
- Ask questions that invite storytelling rather than simple answers
- Push for sensory details, emotional nuance, and personal significance
- If you sense repetition, acknowledge what you've learned and ask for something new

NEVER get stuck asking the same type of question twice. Always evolve the conversation toward deeper, more vivid storytelling.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "I'd love to hear more about that.";

    return NextResponse.json({ response });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to process your message. Please try again.' },
      { status: 500 }
    );
  }
}
