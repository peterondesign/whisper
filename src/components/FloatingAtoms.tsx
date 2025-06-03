'use client';

import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { useTheme } from '@/contexts/ThemeContext';
import { Conversation } from './VoiceCompanion';

interface ConversationAtom {
  id: string;
  position: THREE.Vector3;
  conversation: Conversation;
  selected: boolean;
}

interface FloatingAtomsProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation?: (conversation: Conversation) => void;
  radius?: number;
}

// Individual atom component
function ConversationAtomMesh({ 
  atom, 
  onClick, 
  theme 
}: { 
  atom: ConversationAtom; 
  onClick: () => void;
  theme: 'light' | 'dark';
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y += Math.sin(time * 2 + atom.position.x * 5) * 0.001;
      
      // Gentle rotation
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;

      // Scale based on selection and hover
      const targetScale = atom.selected ? 1.5 : hovered ? 1.2 : 1.0;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  // Color based on conversation recency and theme
  const getAtomColor = () => {
    const hoursSinceConversation = (Date.now() - atom.conversation.timestamp.getTime()) / (1000 * 60 * 60);
    
    if (atom.selected) {
      return theme === 'light' ? '#3B82F6' : '#60A5FA'; // Blue when selected
    } else if (hovered) {
      return theme === 'light' ? '#8B5CF6' : '#A78BFA'; // Purple when hovered
    } else if (hoursSinceConversation < 1) {
      return theme === 'light' ? '#10B981' : '#34D399'; // Green for recent (< 1 hour)
    } else if (hoursSinceConversation < 24) {
      return theme === 'light' ? '#F59E0B' : '#FBBF24'; // Amber for today
    } else {
      return theme === 'light' ? '#6B7280' : '#9CA3AF'; // Gray for older
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={atom.position}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshStandardMaterial
        color={getAtomColor()}
        metalness={0.3}
        roughness={0.4}
        emissive={getAtomColor()}
        emissiveIntensity={atom.selected ? 0.3 : hovered ? 0.2 : 0.1}
      />
      
      {/* Tooltip on hover */}
      {hovered && (
        <Html distanceFactor={10}>
          <div className={`p-3 rounded-lg shadow-lg max-w-xs pointer-events-none transform -translate-x-1/2 -translate-y-full ${
            theme === 'light'
              ? 'bg-white/95 border border-gray-200 text-gray-900'
              : 'bg-gray-900/95 border border-gray-700 text-white'
          }`}>
            <div className="text-xs font-medium mb-1">
              {atom.conversation.timestamp.toLocaleString()}
            </div>
            <div className="text-sm">
              {atom.conversation.userMessage.length > 100 
                ? atom.conversation.userMessage.substring(0, 100) + '...'
                : atom.conversation.userMessage}
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
}

// Main 3D scene component
function ConversationGlobe({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation,
  radius = 5,
  theme 
}: FloatingAtomsProps & { theme: 'light' | 'dark' }) {
  const { camera } = useThree();
  const [atoms, setAtoms] = useState<ConversationAtom[]>([]);

  // Generate atom positions in a sphere formation
  useEffect(() => {
    const newAtoms: ConversationAtom[] = conversations.map((conversation, index) => {
      // Use Fibonacci sphere distribution for even spacing
      const i = index / (conversations.length - 1);
      const theta = 2 * Math.PI * i * ((1 + Math.sqrt(5)) / 2); // Golden angle
      const phi = Math.acos(1 - 2 * i);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      return {
        id: conversation.id,
        position: new THREE.Vector3(x, y, z),
        conversation,
        selected: selectedConversationId === conversation.id
      };
    });

    setAtoms(newAtoms);
  }, [conversations, selectedConversationId, radius]);

  // Auto-rotate camera
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    camera.position.x = Math.cos(time * 0.1) * 12;
    camera.position.z = Math.sin(time * 0.1) * 12;
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Central core */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={theme === 'light' ? '#E5E7EB' : '#374151'}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Connection lines between atoms */}
      {atoms.map((atom) => {
        const positions = new Float32Array([
          0, 0, 0, // Center
          atom.position.x, atom.position.y, atom.position.z // Atom position
        ]);
        
        return (
          <line key={`line-${atom.id}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[positions, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={theme === 'light' ? '#D1D5DB' : '#4B5563'}
              transparent
              opacity={0.3}
            />
          </line>
        );
      })}

      {/* Conversation atoms */}
      {atoms.map((atom) => (
        <ConversationAtomMesh
          key={atom.id}
          atom={atom}
          theme={theme}
          onClick={() => onSelectConversation?.(atom.conversation)}
        />
      ))}

      {/* Orbital rings */}
      {[radius * 0.7, radius * 1.0, radius * 1.3].map((ringRadius, index) => (
        <mesh key={`ring-${index}`} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ringRadius - 0.02, ringRadius + 0.02, 64]} />
          <meshBasicMaterial
            color={theme === 'light' ? '#E5E7EB' : '#374151'}
            transparent
            opacity={0.1}
          />
        </mesh>
      ))}
    </>
  );
}

export default function FloatingAtoms({ 
  conversations, 
  selectedConversationId, 
  onSelectConversation,
  radius = 5 
}: FloatingAtomsProps) {
  const { theme } = useTheme();

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className={`text-center ${
          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <div className="text-lg font-medium mb-2">No conversations yet</div>
          <div className="text-sm">Start a conversation to see your memory atoms</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ 
          position: [12, 0, 0], 
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        className="w-full h-full"
      >
        <ConversationGlobe
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={onSelectConversation}
          radius={radius}
          theme={theme}
        />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={20}
          autoRotate={false}
        />
      </Canvas>

      {/* Legend */}
      <div className={`absolute bottom-4 left-4 p-4 rounded-lg backdrop-blur-md ${
        theme === 'light'
          ? 'bg-white/80 border border-gray-200'
          : 'bg-gray-900/80 border border-gray-700'
      }`}>
        <div className={`text-sm font-medium mb-2 ${
          theme === 'light' ? 'text-gray-900' : 'text-white'
        }`}>
          Memory Atoms
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Recent (&lt; 1 hour)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Older</span>
          </div>
        </div>
      </div>

      {/* Controls info */}
      <div className={`absolute bottom-4 right-4 p-3 rounded-lg backdrop-blur-md text-xs ${
        theme === 'light'
          ? 'bg-white/80 border border-gray-200 text-gray-600'
          : 'bg-gray-900/80 border border-gray-700 text-gray-400'
      }`}>
        <div>🖱️ Drag to rotate • 🔍 Scroll to zoom</div>
        <div>🎯 Click atoms to view conversations</div>
      </div>
    </div>
  );
}
