'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export default function SkeletalLoadingState() {
  const { theme } = useTheme();

  const shimmerVariants = {
    initial: { x: '-100%' },
    animate: { x: '100%' },
  };

  const pulseVariants = {
    initial: { opacity: 0.4 },
    animate: { opacity: 1 },
  };

  const dotVariants = {
    initial: { opacity: 0.3 },
    animate: { opacity: 1 },
  };

  return (
    <div className={`relative w-full h-screen flex flex-col items-center justify-center transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
        : 'bg-gradient-to-br from-gray-900 to-black'
    }`}>
      {/* Floating particles background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              theme === 'light' ? 'bg-gray-400' : 'bg-white/30'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main loading content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Voice icon skeleton */}
        <div className="relative">
          <motion.div
            className={`w-24 h-24 rounded-full flex items-center justify-center ${
              theme === 'light' 
                ? 'bg-gray-200' 
                : 'bg-gray-800'
            } overflow-hidden`}
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className={`absolute inset-0 ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
              }`}
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            
            {/* Microphone icon skeleton */}
            <div className={`w-8 h-8 rounded ${
              theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'
            }`} />
          </motion.div>

          {/* Pulsing rings */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute inset-0 rounded-full border-2 ${
                theme === 'light' 
                  ? 'border-gray-300' 
                  : 'border-gray-700'
              }`}
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* Loading text skeleton */}
        <div className="space-y-4 text-center">
          <motion.div
            className={`h-6 w-64 rounded ${
              theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'
            } overflow-hidden relative`}
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            <motion.div
              className={`absolute inset-0 ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
              }`}
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.2,
              }}
            />
          </motion.div>

          <motion.div
            className={`h-4 w-48 mx-auto rounded ${
              theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'
            } overflow-hidden relative`}
            variants={pulseVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: 0.3,
            }}
          >
            <motion.div
              className={`absolute inset-0 ${
                theme === 'light'
                  ? 'bg-gradient-to-r from-transparent via-white/60 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-white/20 to-transparent'
              }`}
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </motion.div>
        </div>

        {/* Animated loading text */}
        <div className="flex items-center space-x-1">
          <span className={`text-lg font-medium ${
            theme === 'light' ? 'text-gray-700' : 'text-gray-300'
          }`}>
            Initializing Voice Companion
          </span>
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              className={`text-lg font-medium ${
                theme === 'light' ? 'text-gray-700' : 'text-gray-300'
              }`}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.2,
              }}
            >
              .
            </motion.span>
          ))}
        </div>

        {/* Progress bar */}
        <div className={`w-64 h-1 rounded-full overflow-hidden ${
          theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'
        }`}>
          <motion.div
            className={`h-full ${
              theme === 'light' ? 'bg-gray-400' : 'bg-gray-600'
            }`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: 3,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {['Voice Recognition', 'AI Processing', 'Real-time Transcription'].map((feature, i) => (
            <motion.div
              key={feature}
              className={`px-3 py-1 rounded-full text-xs ${
                theme === 'light' 
                  ? 'bg-gray-200 text-gray-600' 
                  : 'bg-gray-800 text-gray-400'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.3 + 1,
              }}
            >
              {feature}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
