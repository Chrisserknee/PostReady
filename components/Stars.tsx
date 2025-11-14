"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export const Stars = () => {
  const { theme } = useTheme();
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate random stars
    const generateStars = () => {
      const newStars: Star[] = [];
      const starCount = 80; // Number of stars (increased)
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100, // Random X position (0-100%)
          y: Math.random() * 100, // Random Y position (0-100%)
          size: Math.random() * 3 + 1.5, // Random size (1.5-4.5px) - larger
          duration: Math.random() * 3 + 2, // Random animation duration (2-5s)
          delay: Math.random() * 5, // Random delay (0-5s)
        });
      }
      
      setStars(newStars);
    };

    generateStars();
  }, []);

  if (theme !== 'dark') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: '#ffffff',
            boxShadow: `0 0 ${star.size * 3}px ${star.size}px rgba(255, 255, 255, 0.9), 0 0 ${star.size * 6}px ${star.size * 2}px rgba(255, 255, 255, 0.4)`,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
