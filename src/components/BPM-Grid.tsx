import { useEffect, useRef } from 'react';
import '../css/BPM-Grid.css';
import type { BeatState } from '../timing_engine/rhythm.types';

interface BPMGridProps {
  isRunning: boolean;
  bpm: number;
  beats: number;
  currentBeat: number;
  smallVersion?: boolean;
  subdivision: number;
  totalBeats: BeatState[];
  handleBeatClick: (index: number) => void;
}

function BPMGrid({
  isRunning,
  // bpm,
  beats,
  currentBeat,
  smallVersion,
  subdivision,
  handleBeatClick,
  totalBeats,
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
      {/* {!smallVersion && (
        <section
          ref={clockArm}
          className={`${isRunning ? 'running' : ''} grid-container__clock-arm`}
          style={{ '--tempo': `${(60 / bpm) * beats}s` } as React.CSSProperties}
        ></section>
      )} */}
      {/* {Array.from(Array(beats / subdivision), (_x, i) => {
        return (
          <div
            className={`dot${isSameBeat(i) ? ' active' : ''} ${isSubdividedNote((beats / (beats / subdivision)) * i) ? 'subdivision' : ''}`}
            key={i}
            style={{ '--i': i } as React.CSSProperties}
            onClick={() => handleBeatClick(i)}
          ></div>
        );
      })} */}
      {totalBeats.map((beat, i) => {
        return (
          <div
            className={`dot${isSameBeat(i) ? ' active' : ''} ${isSubdividedNote((beats / (beats / subdivision)) * i) ? 'subdivision' : ''} ${beat === 0 ? 'off' : ''}`}
            key={i}
            style={{ '--i': i } as React.CSSProperties}
            onClick={() => handleBeatClick(i)}
          ></div>
        );
      })}
    </div>
  );
}

export default BPMGrid;
