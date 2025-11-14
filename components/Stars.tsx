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
      const starCount = 50; // Number of stars
      
      for (let i = 0; i < starCount; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100, // Random X position (0-100%)
          y: Math.random() * 100, // Random Y position (0-100%)
          size: Math.random() * 2 + 1, // Random size (1-3px)
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
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
            boxShadow: `0 0 ${star.size * 2}px ${star.size * 0.5}px rgba(255, 255, 255, 0.8)`,
            animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
