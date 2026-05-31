'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 2000, className = '' }: AnimatedCounterProps) {
  const numericMatch = value.match(/\d+/g);
  const numericString = numericMatch ? numericMatch.join('') : '';
  const targetValue = parseInt(numericString, 10);
  
  let prefix = '';
  let suffix = '';
  if (numericString) {
    const numIndex = value.indexOf(numericString);
    prefix = value.substring(0, numIndex);
    suffix = value.substring(numIndex + numericString.length);
  }

  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || isNaN(targetValue)) return;

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOut * targetValue);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible, targetValue, duration]);

  const hasComma = value.includes(',');
  const formattedCount = hasComma ? count.toLocaleString('en-US') : count.toString();

  return (
    <span ref={ref} className={className}>
      {isNaN(targetValue) ? value : `${prefix}${formattedCount}${suffix}`}
    </span>
  );
}
