import React, { useState, useEffect } from 'react';

interface CountdownProps {
  endTime: Date;
  onEnd?: () => void;
  compact?: boolean;
  finishedText?: string | null;
}

const Countdown: React.FC<CountdownProps> = ({ endTime, onEnd, compact = false, finishedText = "Vendido / Encerrado" }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setIsFinished(true);
        setTimeLeft(0);
        if (onEnd) onEnd();
      } else {
        setIsFinished(false);
        setTimeLeft(distance);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  // Status message logic
  let statusMessage = "";
  let urgentClass = "bg-equus-navy text-white"; // Default
  let textClass = "text-equus-navy";

  if (isFinished) {
    if (finishedText === null) return null;
    return <span className="text-red-800 font-bold tracking-widest uppercase">{finishedText}</span>;
  }

  // Time formatting
  const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((timeLeft % (1000 * 60)) / 1000);

  // Logic for messages based on milliseconds left
  if (timeLeft < 10000) { // < 10 seconds
     statusMessage = "ATENÇÃO VAI VENDER";
     urgentClass = "bg-red-600 text-white animate-pulse";
     textClass = "text-red-600 animate-pulse";
  } else if (timeLeft < 30000) { // < 30 seconds
     statusMessage = "DOU-LHE DUAS";
     urgentClass = "bg-orange-600 text-white";
     textClass = "text-orange-600";
  } else if (timeLeft < 60000) { // < 1 minute
     statusMessage = "DOU-LHE UMA";
     urgentClass = "bg-orange-500 text-white";
     textClass = "text-orange-500";
  } else if (timeLeft < 120000) { // < 2 minutes
     statusMessage = "EM LEILÃO";
     urgentClass = "bg-equus-gold text-equus-navy font-bold";
     textClass = "text-equus-gold";
  }

  if (compact) {
     return (
        <div className="flex flex-col items-center">
            <div className={`flex space-x-1 text-sm font-mono font-bold ${textClass}`}>
                {h > 0 && <span>{h.toString().padStart(2, '0')}h</span>}
                {h > 0 && <span>:</span>}
                <span>{m.toString().padStart(2, '0')}m</span>
                <span>:</span>
                <span>{s.toString().padStart(2, '0')}s</span>
            </div>
            {statusMessage && (
                <span className={`text-[10px] font-bold uppercase ${textClass === 'text-equus-navy' ? 'text-red-600' : textClass}`}>
                    {statusMessage}
                </span>
            )}
        </div>
     );
  }

  return (
    <div className="flex flex-col items-center gap-2">
        <div className="flex gap-4 items-center justify-center">
        <div className={`flex flex-col items-center p-2 min-w-[60px] rounded shadow-md transition-colors duration-500 ${urgentClass}`}>
            <span className="text-2xl font-mono font-bold">{h.toString().padStart(2, '0')}</span>
            <span className="text-xs uppercase tracking-wider opacity-80">Horas</span>
        </div>
        <span className={`text-2xl font-bold ${textClass}`}>:</span>
        <div className={`flex flex-col items-center p-2 min-w-[60px] rounded shadow-md transition-colors duration-500 ${urgentClass}`}>
            <span className="text-2xl font-mono font-bold">{m.toString().padStart(2, '0')}</span>
            <span className="text-xs uppercase tracking-wider opacity-80">Min</span>
        </div>
        <span className={`text-2xl font-bold ${textClass}`}>:</span>
        <div className={`flex flex-col items-center p-2 min-w-[60px] rounded shadow-md transition-colors duration-500 ${urgentClass}`}>
            <span className="text-2xl font-mono font-bold">{s.toString().padStart(2, '0')}</span>
            <span className="text-xs uppercase tracking-wider opacity-80">Seg</span>
        </div>
        </div>
        
        {statusMessage && (
            <div className={`text-lg font-bold uppercase tracking-[0.2em] mt-2 animate-bounce ${textClass === 'text-equus-navy' ? 'text-red-600' : textClass}`}>
                {statusMessage}
            </div>
        )}
    </div>
  );
};

export default Countdown;