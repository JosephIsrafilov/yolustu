'use client';

import React from 'react';

interface SplitTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  className?: string;
  delay?: number;
  animationDuration?: number;
}

export default function SplitText({ text, className = '', delay: _delay, animationDuration: _animationDuration, ...props }: SplitTextProps) {
  void _delay;
  void _animationDuration;

  return (
    <span className={`inline-block ${className}`} {...props}>
      {text.split(' ').map((word, wordIdx) => (
        <span key={`${word}-${wordIdx}`} className="mr-[0.25em] inline-block whitespace-nowrap">
          {word.split('').map((char, charIdx) => (
            <span key={`${char}-${charIdx}`} className="inline-block">
              {char}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
