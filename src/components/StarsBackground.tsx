import React, { useEffect, useRef } from 'react';

export const StarsBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear existing stars if any
    container.innerHTML = '';

    const starCount = 200;
    const stars: HTMLDivElement[] = [];

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'absolute rounded-full bg-white';
      
      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.opacity = `${Math.random() * 0.7 + 0.3}`;
      
      // Animation
      const duration = Math.random() * 3 + 2;
      star.style.animation = `twinkle ${duration}s infinite alternate`;
      
      container.appendChild(star);
      stars.push(star);
    }

    return () => {
      stars.forEach(star => star.remove());
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[-1]"
      style={{
        background: 'radial-gradient(circle at 50% 0%, #1a1a2e 0%, var(--background) 60%)'
      }}
    >
      <style>
        {`
          @keyframes twinkle {
            0% { opacity: 0.3; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1.2); }
          }
        `}
      </style>
    </div>
  );
};

