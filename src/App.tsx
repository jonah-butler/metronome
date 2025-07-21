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
  /**
   * +++++++++++++++++++
   * Metronome Defaults
   * +++++++++++++++++++
   */
  const defaultBpm = 70;
  const defaultFrequency = 750;
  const defaultBeatCount = beatCountData[3];

  /**
   * ++++++++++++++++++++
   * Conductor Reference
   * ++++++++++++++++++++
   */
  const conductor = useRef<Conductor | null>(null);

  /**
   * +++++++++++++++++
   * Conductor State
   * +++++++++++++++++
   */
  const [bpm, setBPM] = useState(70);
  const [isRunning, setIsRunning] = useState(false);

  /**
   * +++++++++++++++++
   * Metronome State
   * +++++++++++++++++
   */
  const [frequency, setFrequency] = useState(defaultFrequency);

  const [beatCount, setBeatCount] = useState<DropdownOptions>(defaultBeatCount);
  const [subdivision, setSubdivision] = useState<DropdownOptions>(
    subdivisionData[0],
  );
  // emitted from rhythm instance
  const [currentBeat, setCurrentBeat] = useState(1);

  /**
   * +++++++++++++++++
   * Polyrhythm State
   * +++++++++++++++++
   */
  const [polyFrequency, setPolyFrequency] = useState(550);
  const [polyBeatCount, setPolyBeatCount] = useState<DropdownOptions>(
    beatCountData[2],
  );
  const [polySubdivision, setPolySubdivision] = useState<DropdownOptions>(
    subdivisionData[0],
  );
  // emitted from polyrhythm instance
  const [polyBeat, setPolyBeat] = useState(1);

  /**
   * ++++++++++
   * App State
   * ++++++++++
   */
  const [usePolyrhythm, setUsePolyrhythm] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState('metronome');

  /**
   * ++++++++++++++++
   * STATE & EFFECT
   * bpm and isRunning state shouldn't retrigger
   * additional effects, so guarding those effect
   * retriggers with ref setting
   *
   */
  const bpmRef = useRef(bpm);
  const isRunningRef = useRef(isRunning);
  useEffect(() => {
    bpmRef.current = bpm;
    isRunningRef.current = isRunning;
  }, [bpm, isRunning]);

  /**
   * +++++++++++
   * EFFECT
   * updates the bpm only without affecting the current rhythm instances
   * using a setTimeout to correctly reset the rhythm visualizer arm
   *
   */
  useEffect(() => {
    if (!conductor.current) return;

    setIsRunning(false);
    setTimeout(() => {
      if (!conductor.current) return;

      conductor.current.update(bpm);
    }, 50);
  }, [bpm]);

  /**
   * +++++++++++++++
   * EFFECT:
   * updates the current running conductor with new rhythm/polyrhythm parameters
   * triggers updates from:
   * > beatCount
   * > polyBeatCount
   * > subdivision
   * > polySubdivision
   * > frequency
   * > polyFrequency
   * > usePolyrhythm
   *
   */
  useEffect(() => {
    if (!conductor.current) {
      const audioCtx = new AudioContext();
      conductor.current = new Conductor({ audioCtx, bpm: defaultBpm });

      conductor.current.on('isRunning', (state: boolean): void => {
        setIsRunning(state);
      });
    }

    const osc = new Oscillator(conductor.current.audioCtx, frequency);

    conductor.current.removeRhythms();
    const updateRhythm = new Rhythm({
      subdivision: Subdivisions[subdivision.value as keyof typeof Subdivisions],
      sound: osc,
      beats: parseInt(beatCount.value),
    });

    conductor.current.addRhythm(updateRhythm);

    if (usePolyrhythm) {
      const polyOsc = new Oscillator(conductor.current.audioCtx, polyFrequency);

      const polyRhythm = new Rhythm({
        subdivision:
          Subdivisions[polySubdivision.value as keyof typeof Subdivisions],
        sound: polyOsc,
        beats: parseInt(beatCount.value),
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

    if (isRunningRef.current) {
      setIsRunning(false);

      setTimeout(() => {
        if (!conductor.current) return;

        conductor.current.start();
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

  function toggleMetronome(): void {
    if (!conductor.current) return;

    if (isRunning) {
      conductor.current.stop();
    } else {
      conductor.current.start();
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
        <div className="absolute-note-container">
          <span>{subdivision.icon}</span>
          {usePolyrhythm && <span>{polySubdivision.icon}</span>}
        </div>
        <Display
          isRunning={isRunning}
          bpm={bpm}
          beats={parseInt(beatCount.value)}
          currentBeat={currentBeat}
          polyrhythm={parseInt(polyBeatCount.value)}
          polyBeat={polyBeat}
          usePoly={usePolyrhythm}
          togglePlayback={toggleMetronome}
          updateBPM={setBPM}
        />
      </section>
      <section className="spinner-container" style={{ display: 'none' }}>
        <BPMSpinner
          togglePlayback={toggleMetronome}
          bpm={bpm}
          isRunning={isRunning}
          updateBPM={setBPM}
          usePolyrhythm={usePolyrhythm}
        />
      </section>
      <section className="polyrhythm-header-container">
        <Toggle
          label=""
          isChecked={usePolyrhythm}
          onChange={updateUsePolyrhythm}
        />
        <div className="polyrhtyhm-beatcount-container">
          <span>
            <h3>{beatCount.value}</h3>
          </span>
          {usePolyrhythm && (
            <span>
              <h3>:{polyBeatCount.value}</h3>
            </span>
          )}
        </div>
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
