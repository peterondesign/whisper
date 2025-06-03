'use client';

import { useEffect, useRef, useState } from 'react';

interface WaveformVisualizerProps {
  isActive: boolean; // true when listening
}

export default function WaveformVisualizer({ isActive }: WaveformVisualizerProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>();

  // Start/stop audio analysis based on isActive
  useEffect(() => {
    if (isActive) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new window.AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;

      analyzeAudio();
    } catch (error) {
      // Fail silently if user blocks mic
    }
  };

  const stopListening = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setAudioLevel(0);
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

    setAudioLevel(normalizedLevel);
    animationRef.current = requestAnimationFrame(analyzeAudio);
  };

  // Render waveform bars
  const generateWaveformBars = () => {
    const bars = [];
    const numBars = 40;
    for (let i = 0; i < numBars; i++) {
      const baseHeight = 4;
      const maxHeight = 80;
      const waveOffset = Math.sin((i / numBars) * Math.PI * 4) * 0.3;
      const centerDistance = Math.abs(i - numBars / 2) / (numBars / 2);
      const centerMultiplier = 1 - centerDistance * 0.6;
      const height = baseHeight + audioLevel * maxHeight * centerMultiplier * (1 + waveOffset);

      bars.push(
        <div
          key={i}
          className="bg-gradient-to-t from-blue-400 to-blue-600 rounded-full transition-all duration-75 ease-out"
          style={{
            width: '3px',
            height: `${height}px`,
            opacity: 0.7 + audioLevel * 0.3,
          }}
        />
      );
    }
    return bars;
  };

  return (
    <div className="flex items-end justify-center gap-1 h-24 w-full select-none pointer-events-none">
      {generateWaveformBars()}
    </div>
  );
}