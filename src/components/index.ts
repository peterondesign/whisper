// Export all components for easier imports
export { default as ParticleSystem } from './ParticleSystem';
export { default as VoiceHandler } from './VoiceHandler';
export { default as VoiceCompanion } from './VoiceCompanion';
export { default as SidePanel } from './SidePanel';

// Re-export types
export type { AppState, Conversation } from './VoiceCompanion';
export type { VoiceHandlerProps } from './VoiceHandler';
export type { ParticleSystemProps } from './ParticleSystem';
