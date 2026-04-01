'use client';

import { useState, useEffect } from 'react';

interface SessionTimerProps {
  startTime?: Date;
}

export function SessionTimer({ startTime = new Date() }: SessionTimerProps) {
  const [time, setTime] = useState('00:00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const elapsed = now.getTime() - startTime.getTime();
      
      const hours = Math.floor(elapsed / (1000 * 60 * 60));
      const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

      setTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <div className="text-center space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {time.split(':').map((unit, idx) => (
          <div key={idx} className="neon-border-cyan bg-slate-950/50 py-3 rounded-lg">
            <div className="text-4xl font-mono font-bold text-cyan-400 tracking-wider neon-glow-cyan">
              {unit}
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-400 uppercase tracking-wider">Time Elapsed</div>
    </div>
  );
}
