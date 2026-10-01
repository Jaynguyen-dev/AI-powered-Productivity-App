import React, { useState, useEffect } from 'react';

export const BackgroundManager = () => {
  const [isNight, setIsNight] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 17 || hour < 7;
  });

  useEffect(() => {
    const checkTime = () => {
      // If we are overriding via the debug flag, skip normal time check
      if (window.__forceNight !== undefined) {
        setIsNight(window.__forceNight);
        return;
      }
      const hour = new Date().getHours();
      setIsNight(hour >= 17 || hour < 7);
    };

    // Check every second so it reacts instantly to clock changes
    const interval = setInterval(checkTime, 1000);
    
    // Check instantly when tabbing back to the window
    window.addEventListener('focus', checkTime);

    // Secret debug toggle: press Shift + B to see the transition!
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'b') {
        window.__forceNight = !(window.__forceNight ?? isNight);
        setIsNight(window.__forceNight);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkTime);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNight]);

  return (
    <>
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: "url('/background.jpg')",
          opacity: isNight ? 0 : 1,
        }}
      />
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: "url('/background-night.jpg')",
          opacity: isNight ? 1 : 0,
        }}
      />
    </>
  );
};
