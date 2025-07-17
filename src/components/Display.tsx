import '../css/Display.css';
import BPMGrid from './BPM-Grid';

interface DisplayProps {
  isRunning: boolean;
  bpm: number;
  beats: number;
  currentBeat: number;
  polyBeat: number;
  polyrhythm: number;
  usePoly: boolean;
}

function Display({
  isRunning,
  bpm,
  beats,
  currentBeat,
  polyBeat,
  polyrhythm,
  usePoly,
}: DisplayProps) {
  return (
    <div className="display_container">
      <section className="grid-outer-container">
        <BPMGrid
          isRunning={isRunning}
          bpm={bpm}
          beats={beats}
          currentBeat={currentBeat}
        />
        {usePoly && (
          <BPMGrid
            isRunning={isRunning}
            bpm={bpm}
            beats={polyrhythm}
            currentBeat={polyBeat}
            smallVersion={true}
          />
        )}
      </section>
    </div>
  );
}

export default Display;
