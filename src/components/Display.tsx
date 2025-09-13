import '../css/Display.css';
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
}: DisplayProps) {
  return (
    <div className="display_container">
      <section className="grid-outer-container">
        <BPMGrid
          isRunning={isRunning}
          bpm={bpm}
          beats={beats}
          currentBeat={currentBeat}
          subdivision={subdivision}
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
            handleBeatClick={(i: number) => handlePolyBeatClick(i)}
          />
        )}
      </section>
    </div>
  );
}

export default Display;
