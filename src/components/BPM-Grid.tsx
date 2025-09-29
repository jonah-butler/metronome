import '../css/BPM-Grid.css';
import type { BeatState } from '../timing_engine/rhythm.types';

interface BPMGridProps {
  beats: number;
  currentBeat: number;
  smallVersion?: boolean;
  subdivision: number;
  totalBeats: BeatState[];
  handleBeatClick: (index: number) => void;
}

function BPMGrid({
  beats,
  currentBeat,
  smallVersion,
  subdivision,
  handleBeatClick,
  totalBeats,
}: BPMGridProps) {
  function isSubdividedNote(beat: number): boolean {
    return !Number.isInteger(beat);
  }

  function isSameBeat(i: number): boolean {
    return 1 + i * subdivision === currentBeat;
  }

  return (
    <div
      className={`grid-container ${smallVersion ? 'small' : ''}`}
      style={{ '--beats': beats / subdivision } as React.CSSProperties}
    >
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
