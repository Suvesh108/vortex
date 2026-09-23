import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Custom hook to detect mobile viewports (<= 768px or native mobile app).
 * Automatically updates on window resize and orientation change.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (Capacitor.isNativePlatform()) return true;
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    setIsMobile(mql.matches);

    mql.addEventListener('change', onChange);
    window.addEventListener('resize', onChange);

    return () => {
      mql.removeEventListener('change', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, [breakpoint]);

  return isMobile;
}
