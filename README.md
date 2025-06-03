# Voice-Driven Reflective AI Companion

A Next.js application that uses voice commands and OpenAI to engage users in reflective conversations about their day, featuring visually rich 3D particle animations built with Three.js.

## Features

- **Voice Interaction**: Speech-to-text input and text-to-speech output using Web Speech API
- **3D Particle Animations**: Responsive particle systems that react to voice and conversation states
- **AI Conversations**: OpenAI integration for thoughtful, empathetic responses
- **Multi-screen Flow**: Splash → Listening → Processing → Conversations → Detail views
- **Real-time Animation States**: 
  - Idle: Gentle circular particle movement
  - Listening: Waveform responding to voice input
  - Processing: Particles converging into globe shape
  - Conversations: Interactive particle globe

## Tech Stack

- **Framework**: Next.js 14+ with TypeScript and App Router
- **Styling**: Tailwind CSS for responsive design
- **3D Graphics**: Three.js with React Three Fiber for particle animations
- **Voice**: Web Speech API for speech recognition and synthesis
- **AI**: OpenAI API integration for conversational responses

## Getting Started

### Prerequisites

- Node.js 18+ 
- An OpenAI API key

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Browser Compatibility

The voice features require a modern browser that supports the Web Speech API:
- Chrome (recommended)
- Edge
- Safari
- Firefox (limited support)

**Note**: HTTPS is required for voice recognition to work in production.

## How It Works

1. **Initial Greeting**: The app asks "How was your day yesterday?" using text-to-speech
2. **Voice Input**: User speaks their response, visualized with reactive particle animations
3. **AI Processing**: OpenAI generates an empathetic, thoughtful response
4. **Conversation Flow**: The AI asks follow-up questions to encourage reflection
5. **Visual Feedback**: 3D particle animations respond to each interaction state

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
