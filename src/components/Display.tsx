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
  updateBPM: (value: number) => void;
  togglePlayback: () => void;
}

// function togglePlayback(): void {
//   console.log('toggling playback');
// }

// function updateBPM(): void {
//   console.log('updating bpm');
// }

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
          />
        )}
      </section>
    </div>
  );
}

export default Display;
