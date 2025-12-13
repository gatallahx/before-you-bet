'use client';

import { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { SplashScreen } from './SplashScreen';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    // Check if this is a fresh page load (not client-side navigation)
    const hasSeenSplash = sessionStorage.getItem('splashShown');

    if (hasSeenSplash) {
      setShowSplash(false);
      setContentReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
    setContentReady(true);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div
        className={`transition-opacity duration-300 ${
          contentReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Navigation />
        <main>{children}</main>
      </div>
    </>
  );
}
