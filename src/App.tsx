import { useEffect, useRef, useState } from 'react';
import './App.css';
import BPMSpinner from './components/BPM-Spinner';
import { Conductor } from './timing_engine/conductor';
import { Scheduler, Subdivisions } from './timing_engine/engine';
import { Oscillator } from './timing_engine/oscillator';
import { Rhythm } from './timing_engine/rhythm';
// import { Rhythm } from './timing_engine/rhythm';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBPM] = useState(120);
  // const isFirstRender = useRef(true);

  const scheduler = useRef<Scheduler | null>(null);
  const scheduler2 = useRef<Scheduler | null>(null);

  const conductor = useRef<Conductor | null>(null);

  useEffect(() => {
    if (!conductor.current) return;

    conductor.current.update(bpm);
  }, [bpm]);

  useEffect(() => {
    const audioCtx = new AudioContext();
    const osc = new Oscillator(audioCtx, 700);
    const osc2 = new Oscillator(audioCtx, 400);

    const bpm = 120;
    conductor.current = new Conductor({ audioCtx, bpm });

    const rhythm1 = new Rhythm({
      // secondsPerBeat: 0.5,
      subdivision: Subdivisions.base,
      sound: osc,
      beats: 4,
      bpm: 120,
    });

    const rhythm2 = new Rhythm({
      // secondsPerBeat: Scheduler.calculateBeatsPerSecond(4, 0.5, 3),
      subdivision: Subdivisions.base,
      sound: osc2,
      beats: 4,
      bpm: 120,
      poly: 6,
    });

    conductor.current.addRhythm(rhythm1, rhythm2);

    return () => {
      console.log('cleaning up');
      conductor.current?.stop();
    };
  }, []);

  // useEffect(() => {
  //   if (isFirstRender.current) {
  //     isFirstRender.current = false;
  //     return;
  //   }

  //   const converted = Scheduler.bpmAndSPB(bpm);

  //   if (!scheduler.current || !scheduler2.current) return;
  //   console.log('updating');

  //   scheduler.current.updateSPB(converted);
  //   scheduler2.current.updateSPB(converted);
  // }, [bpm]);

  // if (!scheduler.current || !scheduler2.current) {
  //   const audioCtx = new AudioContext();
  //   const osc = new Oscillator(audioCtx, 700);
  //   // const osc2 = new Oscillator(audioCtx, 400);

  //   conductor.current = new Conductor({ audioCtx });

  //   const rhythm1 = new Rhythm({
  //     secondsPerBeat: 1,
  //     subdivision: Subdivisions.base,
  //     sound: osc,
  //   });

  //   // const rhythm2 = new Rhythm({
  //   //   secondsPerBeat: Scheduler.calculateBeatsPerSecond(4, 0.6, 6),
  //   //   subdivision: Subdivisions.base,
  //   //   sound: osc2,
  //   // });

  //   conductor.current.addRhythm(rhythm1);

  //   // scheduler.current = new Scheduler({
  //   //   audioCtx,
  //   //   subdivision: Subdivisions.base,
  //   //   secondsPerBeat: 0.6,
  //   //   sound: osc,
  //   // });

  //   // scheduler2.current = new Scheduler({
  //   //   audioCtx,
  //   //   subdivision: Subdivisions.base,
  //   //   secondsPerBeat: Scheduler.calculateBeatsPerSecond(4, 0.6, 6),
  //   //   sound: osc2,
  //   // });
  // }

  function toggleMetronome(): void {
    if (!conductor.current) return;

    if (isRunning) {
      console.log('stopping');
      const state = conductor.current.stop();
      setIsRunning(state);
    } else {
      console.log('starting');
      const state = conductor.current.start();
      setIsRunning(state);
    }

    if (!scheduler.current || !scheduler2.current) return;

    // if (isRunning) {
    //   const state = scheduler.current.stop();
    //   scheduler2.current.stop();
    //   setIsRunning(state);
    // } else {
    //   const state = scheduler.current.start();
    //   scheduler.current.start();
    //   scheduler2.current.start();
    //   setIsRunning(state);
    // }
  }

  return (
    <>
      <div></div>
      <h1>Metronome</h1>
      <section>
        <BPMSpinner bpm={bpm} updateBPM={setBPM} />
      </section>
      <div className="card">
        <button onClick={toggleMetronome}>
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>
    </>
  );
}

export default App;
