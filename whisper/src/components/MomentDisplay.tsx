'use client';

import React from 'react';
import { Moment } from '@/types';

interface MomentDisplayProps {
  moments: Moment[];
  selectedMoment?: Moment;
  onSelectMoment?: (moment: Moment) => void;
  showSelection?: boolean;
  className?: string;
}

export default function MomentDisplay({ 
  moments, 
  selectedMoment, 
  onSelectMoment, 
  showSelection = false,
  className = ""
}: MomentDisplayProps) {
  if (moments.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        {showSelection ? 'Select a moment to explore:' : 'Your moments:'}
      </h3>
      
      <div className="space-y-3">
        {moments.map((moment, index) => (
          <div
            key={moment.id}
            className={`p-3 rounded-lg border transition-all cursor-pointer ${
              selectedMoment?.id === moment.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${showSelection ? 'cursor-pointer' : 'cursor-default'}`}
            onClick={() => showSelection && onSelectMoment?.(moment)}
          >
            <div className="flex items-start gap-3">
              {/* Number Badge */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                selectedMoment?.id === moment.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index + 1}
              </div>
              
              {/* Moment Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {moment.description}
                </p>
                
                {/* Additional Details */}
                {(moment.location || moment.emotion) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {moment.location && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                        📍 {moment.location}
                      </span>
                    )}
                    {moment.emotion && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        😊 {moment.emotion}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Confirmation Status */}
                {moment.confirmed && (
                  <div className="mt-1">
                    <span className="inline-flex items-center text-xs text-green-600">
                      ✓ Confirmed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {showSelection && (
        <div className="mt-3 text-sm text-gray-600">
          Click on a moment above or tell me the number (1, 2, 3) to explore it further.
        </div>
      )}
    </div>
  );
}
