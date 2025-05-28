'use client';

import React from 'react';
import { MemoryFragment, ConversationMemory } from '@/types';
import { Brain, MapPin, Activity, MessageCircle, Heart, Lightbulb } from 'lucide-react';

interface MemoryVisualizationProps {
  memory: ConversationMemory;
  isVisible: boolean;
  className?: string;
}

export default function MemoryVisualization({ memory, isVisible, className = "" }: MemoryVisualizationProps) {
  if (!isVisible || !memory.fragments.length) {
    return null;
  }

  const fragmentsByType = memory.fragments.reduce((acc, fragment) => {
    if (!acc[fragment.type]) {
      acc[fragment.type] = [];
    }
    acc[fragment.type].push(fragment);
    return acc;
  }, {} as Record<string, MemoryFragment[]>);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'action': return <Activity className="w-4 h-4" />;
      case 'thinking': return <Lightbulb className="w-4 h-4" />;
      case 'emotion': return <Heart className="w-4 h-4" />;
      case 'dialogue': return <MessageCircle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'location': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'action': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'thinking': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'emotion': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'dialogue': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Memory Building
        </h3>
        <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs px-2 py-1 rounded-full">
          {memory.fragments.length} fragments
        </span>
      </div>

      <div className="space-y-3">
        {Object.entries(fragmentsByType).map(([type, fragments]) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2">
              {getIconForType(type)}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({fragments.length})
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 ml-6">
              {fragments.map((fragment) => (
                <div
                  key={fragment.id}
                  className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${getColorForType(type)}`}
                  title={`Confidence: ${Math.round(fragment.confidence * 100)}%`}
                >
                  {fragment.content}
                  <div 
                    className="ml-1 w-2 h-2 rounded-full bg-current opacity-60"
                    style={{ opacity: fragment.confidence }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {memory.buildingMoments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Building Moments
            </span>
          </div>
          
          <div className="space-y-2">
            {memory.buildingMoments.map((moment) => (
              <div key={moment.id} className="bg-orange-50 dark:bg-orange-900/20 rounded-md p-2">
                <div className="text-sm text-gray-900 dark:text-white mb-1">
                  {moment.description}
                </div>
                <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                  {moment.location && <span>📍 {moment.location}</span>}
                  {moment.emotion && <span>💭 {moment.emotion}</span>}
                  {moment.action && <span>⚡ {moment.action}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {memory.freeConversationStartTime && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Free conversation mode</span>
            <span>
              {Math.round((Date.now() - memory.freeConversationStartTime.getTime()) / 1000)}s
            </span>
          </div>
          <div className="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.min((Date.now() - memory.freeConversationStartTime.getTime()) / (5 * 60 * 1000) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
