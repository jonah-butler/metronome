import { useEffect, useRef } from 'react';
import '../css/BPM-Grid.css';

interface BPMGridProps {
  isRunning: boolean;
  bpm: number;
  beats: number;
  currentBeat: number;
  smallVersion?: boolean;
  subdivision: number;
}

function BPMGrid({
  isRunning,
  bpm,
  beats,
  currentBeat,
  smallVersion,
  subdivision,
}: BPMGridProps) {
  useEffect(() => {
    if (!clockArm.current) return;

    if (!isRunning) {
      clockArm.current.style.transform = 'rotate(0deg) !important';
    }
  }, [isRunning]);

  function isSubdividedNote(beat: number): boolean {
    return !Number.isInteger(beat);
  }

  function isSameBeat(i: number): boolean {
    return 1 + i * subdivision === currentBeat;
  }

  const clockArm = useRef<HTMLDivElement | null>(null);

  return (
    <div
      className={`grid-container ${smallVersion ? 'small' : ''}`}
      style={{ '--beats': beats / subdivision } as React.CSSProperties}
    >
      {!smallVersion && (
        <section
          ref={clockArm}
          className={`${isRunning ? 'running' : ''} grid-container__clock-arm`}
          style={{ '--tempo': `${(60 / bpm) * beats}s` } as React.CSSProperties}
        ></section>
      )}
      {Array.from(Array(beats / subdivision), (_x, i) => {
        return (
          <div
            className={`dot${isSameBeat(i) ? ' active' : ''} ${isSubdividedNote((beats / (beats / subdivision)) * i) ? 'subdivision' : ''}`}
            key={i}
            style={{ '--i': i } as React.CSSProperties}
          ></div>
        );
      })}
    </div>
  );
}

export default BPMGrid;
