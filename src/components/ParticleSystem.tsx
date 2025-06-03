'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

export type AppState = 'splash' | 'waiting' | 'listening' | 'processing' | 'conversations';

export interface Conversation {
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  position?: [number, number, number];
}

export interface ParticleSystemProps {
  state: AppState;
  isListening: boolean;
  conversations: Conversation[];
  theme?: 'light' | 'dark';
}

function Particles({ state, isListening, conversations, theme = 'dark' }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const conversationSpotsRef = useRef<THREE.Group>(null);
  const [positions, setPositions] = useState<Float32Array>(new Float32Array());

  useEffect(() => {
    const particleCount = 500; // Reduced for better performance
    const positions = new Float32Array(particleCount * 3);

    // Generate scattered particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      switch (state) {
        case 'splash':
        case 'waiting':
          // Gentle scattered formation
          const radius = 2 + Math.random() * 3;
          const phi = Math.random() * Math.PI * 2;
          const theta = Math.random() * Math.PI;
          positions[i3] = radius * Math.sin(theta) * Math.cos(phi);
          positions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
          positions[i3 + 2] = radius * Math.cos(theta);
          break;
          
        case 'listening':
          // Responsive waveform
          const x = (i / particleCount - 0.5) * 8;
          const wave = Math.sin(x * 3) * (isListening ? 1.5 : 0.8);
          positions[i3] = x;
          positions[i3 + 1] = wave + (Math.random() - 0.5) * 0.3;
          positions[i3 + 2] = (Math.random() - 0.5) * 1;
          break;
          
        case 'processing':
          // Swirling inward motion
          const angle = (i / particleCount) * Math.PI * 4;
          const distance = 3 - (i / particleCount) * 2;
          positions[i3] = Math.cos(angle) * distance;
          positions[i3 + 1] = Math.sin(angle) * distance * 0.5;
          positions[i3 + 2] = (Math.random() - 0.5) * 2;
          break;
          
        case 'conversations':
          // More scattered, with space for conversation spots
          const scatterRadius = 1.5 + Math.random() * 2.5;
          const scatterPhi = Math.random() * Math.PI * 2;
          const scatterTheta = Math.random() * Math.PI;
          positions[i3] = scatterRadius * Math.sin(scatterTheta) * Math.cos(scatterPhi);
          positions[i3 + 1] = scatterRadius * Math.sin(scatterTheta) * Math.sin(scatterPhi);
          positions[i3 + 2] = scatterRadius * Math.cos(scatterTheta);
          break;
      }
    }

    setPositions(positions);
  }, [state, isListening]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Very slow rotation
      pointsRef.current.rotation.y += 0.001;
      
      if (isListening && state.clock.elapsedTime) {
        // Gentle pulse for listening
        const time = state.clock.elapsedTime;
        const scale = 1 + Math.sin(time * 3) * 0.03;
        pointsRef.current.scale.setScalar(scale);
      } else {
        pointsRef.current.scale.setScalar(1);
      }
    }

    // Animate conversation spots
    if (conversationSpotsRef.current && state.clock.elapsedTime) {
      const time = state.clock.elapsedTime;
      conversationSpotsRef.current.rotation.y += 0.002;
      
      // Gentle floating animation for conversation spots
      conversationSpotsRef.current.children.forEach((child, index) => {
        child.position.y += Math.sin(time + index) * 0.001;
      });
    }
  });

  return (
    <group>
      {/* Background particles */}
      <Points ref={pointsRef} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={theme === 'light' ? '#94a3b8' : '#64748b'}
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={theme === 'light' ? 0.4 : 0.6}
        />
      </Points>

      {/* Conversation spots */}
      {state === 'conversations' && (
        <group ref={conversationSpotsRef}>
          {conversations.map((conversation, index) => (
            <ConversationSpot
              key={conversation.id}
              conversation={conversation}
              index={index}
              theme={theme}
            />
          ))}
        </group>
      )}
    </group>
  );
}

// New component for clickable conversation spots
function ConversationSpot({ 
  conversation, 
  index, 
  theme 
}: { 
  conversation: Conversation; 
  index: number; 
  theme: 'light' | 'dark';
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Position conversations in a loose spiral
  const angle = index * 0.8;
  const radius = 3 + (index * 0.3);
  const position: [number, number, number] = [
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 2,
    Math.sin(angle) * radius
  ];

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = position[1] + Math.sin(time + index) * 0.1;
      
      // Scale effect on hover
      const targetScale = hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  const handleClick = () => {
    // Navigate to conversation detail or trigger action
    console.log('Clicked conversation:', conversation.id);
  };

  return (
    <mesh
      ref={meshRef}
      position={[position[0], position[1], position[2]]}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshBasicMaterial
        color={hovered ? '#3b82f6' : theme === 'light' ? '#6b7280' : '#9ca3af'}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function ParticleSystem(props: ParticleSystemProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white/50">Loading 3D environment...</div>
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <Particles {...props} />
    </Canvas>
  );
}

export default ParticleSystem;
