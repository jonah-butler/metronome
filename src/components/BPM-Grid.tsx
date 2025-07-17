import { useEffect, useRef } from 'react';
import '../css/BPM-Grid.css';

interface BPMGridProps {
  isRunning: boolean;
  bpm: number;
  beats: number;
  currentBeat: number;
  smallVersion?: boolean;
}

function BPMGrid({
  isRunning,
  bpm,
  beats,
  currentBeat,
  smallVersion,
}: BPMGridProps) {
  useEffect(() => {
    if (!clockArm.current) return;

    if (!isRunning) {
      clockArm.current.style.transform = 'rotate(0deg) !important';
    }
  }, [isRunning]);

  const clockArm = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className={`grid-container ${smallVersion ? 'small' : ''}`}
      style={{ '--beats': beats } as React.CSSProperties}
    >
      {!smallVersion && (
        <section
          ref={clockArm}
          className={`${isRunning ? 'running' : ''} grid-container__clock-arm`}
          style={{ '--tempo': `${(60 / bpm) * beats}s` } as React.CSSProperties}
        ></section>
      )}
      {Array.from(Array(beats), (_x, i) => {
        return (
          <div
            className={`dot${i + 1 === Math.floor(currentBeat) ? ' active' : ''}`}
            key={i}
            style={{ '--i': i } as React.CSSProperties}
          ></div>
        );
      })}
    </div>
  );
}

export default BPMGrid;
