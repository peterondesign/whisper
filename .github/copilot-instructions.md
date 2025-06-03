# Copilot Instructions for Voice-Driven Reflective AI Companion

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Next.js application for a voice-driven reflective AI companion with the following characteristics:

## Project Overview
- **Framework**: Next.js 14+ with TypeScript and App Router
- **Styling**: Tailwind CSS for responsive design
- **3D Graphics**: Three.js for particle animations and 3D visualizations
- **Voice**: Web Speech API for speech recognition and synthesis
- **AI**: OpenAI API integration for conversational responses
- **State**: React Context/hooks for conversation and animation state

## Key Features
1. **Voice Interaction**: Speech-to-text input and text-to-speech output
2. **3D Particle Animations**: Responsive particle systems that react to voice and conversation states
3. **Conversation History**: Persistent storage of AI conversations
4. **Multi-screen Flow**: Splash → Listening → Processing → Conversations → Detail views

## Code Guidelines
- Use TypeScript for all components and utilities
- Follow React best practices with hooks and functional components
- Implement responsive design with Tailwind CSS
- Optimize Three.js performance for smooth animations
- Handle audio permissions and browser compatibility gracefully
- Structure API routes securely for OpenAI integration
- Use proper error handling for voice and AI features

## Animation States
- **Idle**: Gentle circular particle movement
- **Listening**: Waveform responding to voice input
- **Processing**: Particles converging into globe shape
- **Conversations**: Interactive particle globe with clickable nodes

When generating code, prioritize:
- Performance optimization for 3D animations
- Accessibility considerations for voice interactions
- Cross-browser compatibility
- Clean component architecture
- Proper TypeScript typing
