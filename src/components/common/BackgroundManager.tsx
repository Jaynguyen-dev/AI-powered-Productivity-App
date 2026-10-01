import React, { useState, useEffect } from 'react';

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'midnight';

export const BackgroundManager = () => {
  const getTimeOfDay = (): TimeOfDay => {
    if ((window as any).__forceTimeOfDay !== undefined) {
      return (window as any).__forceTimeOfDay;
    }
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 21 || hour < 5) return 'midnight';
    return 'evening';
  };

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay);

  useEffect(() => {
    const checkTime = () => {
      setTimeOfDay(getTimeOfDay());
    };

    const interval = setInterval(checkTime, 1000);
    window.addEventListener('focus', checkTime);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 'b') {
        const current = (window as any).__forceTimeOfDay || timeOfDay;
        const next: TimeOfDay = 
          current === 'morning' ? 'afternoon' : 
          current === 'afternoon' ? 'evening' : 
          current === 'evening' ? 'midnight' : 'morning';
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
      {/* Morning: Waterfall */}
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: "url('/background.jpg')",
          opacity: timeOfDay === 'morning' ? 1 : 0,
        }}
      />
      {/* Afternoon: Mountain Road */}
      <div
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: "url('/background-afternoon.jpg')",
          opacity: timeOfDay === 'afternoon' ? 1 : 0,
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
