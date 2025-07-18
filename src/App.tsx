import { useEffect, useRef, useState } from 'react';
import './App.css';
import BPMSpinner from './components/BPM-Spinner';
import Display from './components/Display';
import Dropdown, { type DropdownOptions } from './components/Dropdown';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import { beatCountData, subdivisionData } from './data';
import { Conductor, Subdivisions } from './timing_engine/conductor';
import { Oscillator } from './timing_engine/oscillator';
import { Rhythm } from './timing_engine/rhythm';

function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [bpm, setBPM] = useState(70);
  const [currentBeat, setCurrentBeat] = useState(1);
  const [polyBeat, setPolyBeat] = useState(1);

  const [beatCount, setBeatCount] = useState<DropdownOptions>(beatCountData[3]);
  const [polyBeatCount, setPolyBeatCount] = useState<DropdownOptions>(
    beatCountData[2],
  );

  const [subdivision, setSubdivision] = useState<DropdownOptions>(
    subdivisionData[0],
  );
  const [polySubdivision, setPolySubdivision] = useState<DropdownOptions>(
    subdivisionData[0],
  );

  const [frequency, setFrequency] = useState(750);
  const [polyFrequency, setPolyFrequency] = useState(550);

  const [usePolyrhythm, setUsePolyrhythm] = useState(false);

  const [selectedSetting, setSelectedSetting] = useState('metronome');

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

  // useEffect(() => {
  //   if (!conductor.current) return;
  //   console.log('updating sub');

  //   const osc = new Oscillator(conductor.current.audioCtx, 900);

  //   conductor.current.removeRhythms();
  //   const updateRhythm = new Rhythm({
  //     subdivision: Subdivisions[subdivision.value as keyof typeof Subdivisions],
  //     sound: osc,
  //     beats,
  //     bpm,
  //   });
  //   conductor.current.addRhythm(updateRhythm);

  //   updateRhythm.on('beatChange', (beat: number) => {
  //     setCurrentBeat(beat);
  //   });

  //   if (isRunning) {
  //     setIsRunning(false);

  //     setTimeout(() => {
  //       if (!conductor.current) return;

  //       setIsRunning(conductor.current.start());
  //     }, 50);
  //   }
  // }, [subdivision]);

  useEffect(() => {
    if (!conductor.current) return;

    const osc = new Oscillator(conductor.current.audioCtx, frequency);

    conductor.current.removeRhythms();
    const updateRhythm = new Rhythm({
      subdivision: Subdivisions[subdivision.value as keyof typeof Subdivisions],
      sound: osc,
      beats: parseInt(beatCount.value),
      bpm,
    });

    conductor.current.addRhythm(updateRhythm);

    if (usePolyrhythm) {
      const polyOsc = new Oscillator(conductor.current.audioCtx, polyFrequency);

      const polyRhythm = new Rhythm({
        subdivision:
          Subdivisions[polySubdivision.value as keyof typeof Subdivisions],
        sound: polyOsc,
        beats: parseInt(beatCount.value),
        bpm,
        poly: parseInt(polyBeatCount.value),
      });

      polyRhythm.on('beatChange', (beat: number): void => {
        setPolyBeat(beat);
      });

      conductor.current.addRhythm(polyRhythm);
    }

    updateRhythm.on('beatChange', (beat: number) => {
      setCurrentBeat(beat);
    });

    if (isRunning) {
      setIsRunning(false);

      setTimeout(() => {
        if (!conductor.current) return;

        setIsRunning(conductor.current.start());
      }, 50);
    }
  }, [
    subdivision,
    beatCount,
    frequency,
    usePolyrhythm,
    polyBeatCount,
    polyFrequency,
    polySubdivision,
  ]);

  useEffect(() => {
    const audioCtx = new AudioContext();
    const osc = new Oscillator(audioCtx, frequency);
    // const osc2 = new Oscillator(audioCtx, 400);

    const bpm = 70;
    conductor.current = new Conductor({ audioCtx, bpm });

    const rhythm1 = new Rhythm({
      subdivision: Subdivisions.base,
      sound: osc,
      beats,
      bpm,
    });

    rhythm1.on('beatChange', (beat: number) => {
      setCurrentBeat(beat);
    });

    // const rhythm2 = new Rhythm({
    //   subdivision: Subdivisions.base,
    //   sound: osc2,
    //   beats,
    //   bpm,
    //   poly: 3,
    // });

    // rhythm2.on('beatChange', (beat: number): void => {
    //   setPolyBeat(beat);
    // });

    conductor.current.addRhythm(rhythm1);

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

  function updateSubdivision(value: string): void {
    setSubdivision(
      subdivisionData.find((s) => s.value === value) || subdivisionData[0],
    );
  }

  function updatePolySubdivision(value: string): void {
    setPolySubdivision(
      subdivisionData.find((s) => s.value === value) || subdivisionData[0],
    );
  }

  function updateBeatCount(value: string): void {
    setBeatCount(
      beatCountData.find((b) => b.value === value) || beatCountData[3],
    );
  }

  function updatePolyBeatCount(value: string): void {
    console.log('updating poly');
    setPolyBeatCount(
      beatCountData.find((b) => b.value === value) || beatCountData[3],
    );
  }

  function updateUsePolyrhythm(usePoly: boolean): void {
    setUsePolyrhythm(usePoly);
    if (!usePoly && selectedSetting === 'polyrhythm') {
      setSelectedSetting('metronome');
    }
  }

  return (
    <>
      <section>
        <span>{subdivision.icon}</span>
        {usePolyrhythm && <span>{polySubdivision.icon}</span>}
        <Display
          isRunning={isRunning}
          bpm={bpm}
          beats={parseInt(beatCount.value)}
          currentBeat={currentBeat}
          polyrhythm={parseInt(polyBeatCount.value)}
          polyBeat={polyBeat}
          usePoly={usePolyrhythm}
        />
        {/* Polyrhtyhm Toggle */}
        <section className="polyrhythm-container">
          <Toggle
            label=""
            isChecked={usePolyrhythm}
            onChange={updateUsePolyrhythm}
          />
        </section>
      </section>
      <section className="spinner-container">
        <BPMSpinner
          togglePlayback={toggleMetronome}
          bpm={bpm}
          isRunning={isRunning}
          updateBPM={setBPM}
        />
      </section>
      <section className="polyrhythm-header-container">
        <h3>{beatCount.value}</h3>
        {usePolyrhythm && <h3>:{polyBeatCount.value}</h3>}
      </section>
      <section className="settings-toggle-row">
        <button
          onClick={() => setSelectedSetting('metronome')}
          className={selectedSetting === 'metronome' ? 'active' : 'inactive'}
        >
          Metronome
        </button>
        {usePolyrhythm && (
          <button
            onClick={() => setSelectedSetting('polyrhythm')}
            className={selectedSetting === 'polyrhythm' ? 'active' : 'inactive'}
          >
            PolyRhythm
          </button>
        )}
      </section>
      {/* Metronome Settings */}
      {selectedSetting === 'metronome' && (
        <div className="settings-row">
          {/* Subdivision */}
          <section>
            <Dropdown
              label="Subdivision"
              data={subdivisionData}
              currentValue={subdivision}
              onChange={updateSubdivision}
            />
          </section>

          {/* Beat Count */}
          <section>
            <Dropdown
              label="Beat Count"
              data={beatCountData}
              currentValue={beatCount}
              onChange={updateBeatCount}
            />
          </section>

          {/* Frequency Slider */}
          <section>
            <Slider
              min={100}
              max={1500}
              step={10}
              currentValue={frequency}
              onChange={setFrequency}
            />
          </section>
        </div>
      )}

      {/* Polyrhythm Settings */}
      {selectedSetting === 'polyrhythm' && usePolyrhythm && (
        <div className="settings-row">
          {/* Subdivision */}
          <section>
            <Dropdown
              label="Subdivision"
              data={subdivisionData}
              currentValue={polySubdivision}
              onChange={updatePolySubdivision}
            />
          </section>

          {/* Beat Count */}
          <section>
            <Dropdown
              label="Poly Beat"
              data={beatCountData}
              currentValue={polyBeatCount}
              onChange={updatePolyBeatCount}
            />
          </section>

          {/* Frequency Slider */}
          <section>
            <Slider
              min={100}
              max={1500}
              step={10}
              currentValue={polyFrequency}
              onChange={setPolyFrequency}
            />
          </section>
        </div>
      )}
    </>
  );
}

export default App;
