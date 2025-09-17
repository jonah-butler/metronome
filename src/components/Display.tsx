import { useRef } from 'react';
import '../css/Display.css';
import type { BeatState } from '../timing_engine/rhythm.types';
import BPMGrid from './BPM-Grid';
import BPMSpinner from './BPM-Spinner';

interface DisplayProps {
  isRunning: boolean;
  bpm: number;
  beats: number;
  currentBeat: number;
  polyBeat: number;
  polyrhythm: number;
  usePoly: boolean;
  subdivision: number;
  polySubdivision: number;
  totalBeats: BeatState[];
  totalPolyBeats: BeatState[];
  updateBPM: (value: number) => void;
  togglePlayback: () => void;
  handleBeatClick: (i: number) => void;
  handlePolyBeatClick: (i: number) => void;
}

function Display({
  isRunning,
  bpm,
  beats,
  currentBeat,
  polyBeat,
  polyrhythm,
  usePoly,
  togglePlayback,
  updateBPM,
  subdivision,
  polySubdivision,
  handleBeatClick,
  handlePolyBeatClick,
  totalBeats,
  totalPolyBeats,
}: DisplayProps) {
  const clockArm = useRef<HTMLDivElement | null>(null);

  return (
    <div className="display_container">
      <section className="grid-outer-container">
        <BPMGrid
          isRunning={isRunning}
          bpm={bpm}
          beats={beats}
          currentBeat={currentBeat}
          subdivision={subdivision}
          totalBeats={totalBeats}
          handleBeatClick={(i: number) => handleBeatClick(i)}
        />
        <BPMSpinner
          togglePlayback={togglePlayback}
          updateBPM={updateBPM}
          isRunning={isRunning}
          bpm={bpm}
          usePolyrhythm={usePoly}
        />
        {usePoly && (
          <BPMGrid
            isRunning={isRunning}
            bpm={bpm}
            beats={polyrhythm}
            currentBeat={polyBeat}
            smallVersion={true}
            subdivision={polySubdivision}
            totalBeats={totalPolyBeats}
            handleBeatClick={(i: number) => handlePolyBeatClick(i)}
          />
        )}
        <section
          ref={clockArm}
          className={`${isRunning ? 'running' : ''} grid-container__clock-arm`}
          style={{ '--tempo': `${(60 / bpm) * beats}s` } as React.CSSProperties}
        ></section>
      </section>
    </div>
  );
}

export default Display;
