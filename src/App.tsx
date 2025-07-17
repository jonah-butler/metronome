import { useEffect, useRef, useState } from 'react';
import './App.css';
import BPMSpinner from './components/BPM-Spinner';
import Display from './components/Display';
import { Conductor, Subdivisions } from './timing_engine/conductor';
import { Oscillator } from './timing_engine/oscillator';
import { Rhythm } from './timing_engine/rhythm';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBPM] = useState(70);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [polyBeat, setPolyBeat] = useState(1);

  const conductor = useRef<Conductor | null>(null);

  const beats = 4;

  useEffect(() => {
    if (!conductor.current) return;

    setIsRunning(false);
    setTimeout(() => {
      if (!conductor.current) return;

      setIsRunning(conductor.current.update(bpm));
    }, 50);
  }, [bpm]);

  useEffect(() => {
    const audioCtx = new AudioContext();
    const osc = new Oscillator(audioCtx, 900);
    const osc2 = new Oscillator(audioCtx, 400);

    const bpm = 70;
    conductor.current = new Conductor({ audioCtx, bpm });

    const rhythm1 = new Rhythm({
      subdivision: Subdivisions.quintuplets,
      sound: osc,
      beats,
      bpm,
    });

    rhythm1.on('beatChange', (beat: number) => {
      setCurrentBeat(beat);
    });

    const rhythm2 = new Rhythm({
      subdivision: Subdivisions.base,
      sound: osc2,
      beats,
      bpm,
      poly: 4,
    });

    rhythm2.on('beatChange', (beat: number): void => {
      setPolyBeat(beat);
    });

    conductor.current.addRhythm(rhythm1, rhythm2);

    return () => {
      conductor.current?.stop();
    };
  }, []);

  function toggleMetronome(): void {
    if (!conductor.current) return;

    if (isRunning) {
      const state = conductor.current.stop();
      setIsRunning(state);
    } else {
      const state = conductor.current.start();
      setIsRunning(state);
    }
  }

  return (
    <>
      <section>
        <h1>Metronome</h1>
        <Display
          isRunning={isRunning}
          bpm={bpm}
          beats={beats}
          currentBeat={currentBeat}
          polyrhythm={4}
          polyBeat={polyBeat}
          usePoly={false}
        />
      </section>
      <section className="spinner-container">
        <BPMSpinner
          togglePlayback={toggleMetronome}
          bpm={bpm}
          isRunning={isRunning}
          updateBPM={setBPM}
        />
      </section>
      <div className="card"></div>
    </>
  );
}

export default App;
