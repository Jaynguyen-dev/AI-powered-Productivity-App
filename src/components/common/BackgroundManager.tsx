import React, { useState, useEffect } from 'react';

export const BackgroundManager = () => {
  const [isNight, setIsNight] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 17 || hour < 7;
  });

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 17 || hour < 7);
    };

    // Check every minute
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

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
