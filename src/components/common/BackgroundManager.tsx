import React, { useState, useEffect } from 'react';

type TimeOfDay = 'day' | 'evening' | 'midnight';

export const BackgroundManager = () => {
  const getTimeOfDay = (): TimeOfDay => {
    // If we are overriding via the debug flag, skip normal time check
    if ((window as any).__forceTimeOfDay !== undefined) {
      return (window as any).__forceTimeOfDay;
    }
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 17) return 'day';
    if (hour >= 21 || hour < 5) return 'midnight';
    return 'evening';
  };

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);

  useEffect(() => {
    const checkTime = () => {
      setTimeOfDay(getTimeOfDay());
    };

    // Check every second so it reacts instantly to clock changes
    const interval = setInterval(checkTime, 1000);
    
    // Check instantly when tabbing back to the window
    window.addEventListener('focus', checkTime);

    // Secret debug toggle: press Shift + B to cycle the transition!
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'b') {
        const current = (window as any).__forceTimeOfDay || timeOfDay;
        const next: TimeOfDay = 
          current === 'day' ? 'evening' : 
          current === 'evening' ? 'midnight' : 'day';
        (window as any).__forceTimeOfDay = next;
        setTimeOfDay(next);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkTime);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [timeOfDay]);

  return (
    <>
      {/* Day: Waterfall */}
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: "url('/background.jpg')",
          opacity: timeOfDay === 'day' ? 1 : 0,
        }}
      />
      {/* Evening: Sunset River */}
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: "url('/background-night.jpg')",
          opacity: timeOfDay === 'evening' ? 1 : 0,
        }}
      />
      {/* Midnight: Moon */}
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: "url('/background-midnight.jpg')",
          opacity: timeOfDay === 'midnight' ? 1 : 0,
        }}
      />
    </>
  );
};
