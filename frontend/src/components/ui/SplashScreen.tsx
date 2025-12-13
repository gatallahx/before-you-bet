'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete?: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'fade-out' | 'done'>('enter');

  useEffect(() => {
    // Start entrance animation immediately, then show visible state
    const enterTimer = setTimeout(() => {
      setPhase('visible');
    }, 100);

    // Hold visible for 2.5s, then start fade out
    const visibleTimer = setTimeout(() => {
      setPhase('fade-out');
    }, 2600);

    // Complete animation after fade (800ms)
    const completeTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 3400);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(visibleTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (phase === 'done') {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-opacity duration-700 ease-out ${
        phase === 'fade-out' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo container with entrance animation */}
        <div
          className={`relative transition-all duration-700 ease-out ${
            phase === 'enter'
              ? 'scale-50 opacity-0'
              : phase === 'fade-out'
              ? 'scale-110 opacity-0'
              : 'scale-100 opacity-100'
          }`}
        >
          {/* Glow effect behind logo */}
          <div className="absolute inset-0 w-32 h-32 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-xl animate-pulse-glow" />

          {/* Logo */}
          <div className="relative w-32 h-32">
            <Image
              src="/logos/logo.png"
              alt="Before You Bet Logo"
              width={128}
              height={128}
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>

        {/* App name with staggered entrance */}
        <h1
          className={`text-3xl font-bold text-gray-900 dark:text-white tracking-tight transition-all duration-700 ease-out delay-200 ${
            phase === 'enter'
              ? 'opacity-0 translate-y-4'
              : phase === 'fade-out'
              ? 'opacity-0 -translate-y-2'
              : 'opacity-100 translate-y-0'
          }`}
        >
          Before You Bet
        </h1>

        {/* Tagline */}
        <p
          className={`text-sm text-gray-500 dark:text-gray-400 transition-all duration-700 ease-out delay-300 ${
            phase === 'enter'
              ? 'opacity-0 translate-y-4'
              : phase === 'fade-out'
              ? 'opacity-0'
              : 'opacity-100 translate-y-0'
          }`}
        >
          AI-powered prediction market analysis
        </p>

        {/* Loading bar */}
        <div
          className={`w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden transition-all duration-500 delay-500 ${
            phase === 'enter' ? 'opacity-0 scale-x-50' : phase === 'fade-out' ? 'opacity-0' : 'opacity-100 scale-x-100'
          }`}
        >
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
