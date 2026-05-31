'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SplitTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  className?: string;
  delay?: number;
  animationDuration?: number;
}

export default function SplitText({
  text,
  className = '',
  delay = 30,
  animationDuration = 600,
  ...props
}: SplitTextProps) {
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const words = text.split(' ');
  let charIndex = 0;

  return (
    <span
      ref={containerRef}
      className={`inline-block select-none ${className}`}
      {...props}
    >
      {words.map((word, wordIdx) => {
        const letters = word.split('');
        return (
          <span key={wordIdx} className="inline-block whitespace-nowrap mr-[0.25em]">
            {letters.map((char, charIdx) => {
              const currentIdx = charIndex++;
              return (
                <span
                  key={charIdx}
                  className={`inline-block transition-all ease-out`}
                  style={{
                    opacity: animated ? 1 : 0,
                    transform: animated ? 'translate3d(0,0,0)' : 'translate3d(0,25px,0)',
                    transitionDuration: `${animationDuration}ms`,
                    transitionDelay: `${currentIdx * delay}ms`,
                  }}
                >
                  {char}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}
