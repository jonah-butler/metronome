import { useEffect, useRef, useState } from 'react';
import './App.css';
import Display from './components/Display';
import Dropdown, { type DropdownOptions } from './components/Dropdown';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import { beatCountData, subdivisionData } from './data';
import {
  getBeatCount,
  getBeatState,
  getSubdivision,
} from './services/rhythm.services';
import { releaseWakeLock, requestWakeLock } from './services/wakelock';
import { Conductor } from './timing_engine/conductor';
import { Oscillator } from './timing_engine/oscillator';
import { Rhythm } from './timing_engine/rhythm';
import { type BeatState } from './timing_engine/rhythm.types';
import { Subdivisions } from './timing_engine/types';

function App() {
  /**
   * +++++++++++++++++++
   * Metronome Defaults
   * +++++++++++++++++++
   */
  const defaultBpm = 60;
  const defaultFrequency = 750;
  const defaultBeatCount = beatCountData[3];

  /**
   * ++++++++++++++++++++
   * Conductor Reference
   * ++++++++++++++++++++
   */
  const conductor = useRef<Conductor | null>(null);

  const initializeConductor = (): Conductor => {
    const audioCtx = new AudioContext();
    const conductor = new Conductor({ audioCtx, bpm: defaultBpm });

    return conductor;
  };

  /**
   * +++++++++++++++++
   * Conductor State
   * +++++++++++++++++
   */
  const [bpm, setBPM] = useState(60);
  const [isRunning, setIsRunning] = useState(false);

  /**
   * +++++++++++++++++
   * Metronome State
   * +++++++++++++++++
   */
  const [frequency, setFrequency] = useState(defaultFrequency);

  const beatCountRef = useRef(defaultBeatCount);
  const [beatCount, setBeatCount] = useState<DropdownOptions>(defaultBeatCount);
  const [subdivision, setSubdivision] = useState<DropdownOptions>(
    subdivisionData[0],
  );
  const subdivisionRef = useRef(subdivision);
  // emitted from rhythm instance
  const [currentBeat, setCurrentBeat] = useState(1);
  const defaultBeats = new Array(
    parseInt(beatCount.value) /
      Subdivisions[subdivision.value as keyof typeof Subdivisions],
  ).fill(1);
  const [totalBeats, setTotalBeats] = useState<BeatState[]>(defaultBeats);
  const totalBeatsRef = useRef<BeatState[]>(defaultBeats);

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
  const polySubdivisionRef = useRef(polySubdivision);
  // emitted from polyrhythm instance
  const [polyBeat, setPolyBeat] = useState(1);
  const defaultPolyBeats = new Array(
    parseInt(polyBeatCount.value) /
      Subdivisions[polySubdivision.value as keyof typeof Subdivisions],
  ).fill(1);
  const [totalPolyBeats, setTotalPolyBeats] =
    useState<BeatState[]>(defaultPolyBeats);
  const totalPolyBeatsRef = useRef<BeatState[]>(defaultPolyBeats);
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
   * additional effects, state safeguard effect
   * ++++++++++++++++
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
   * +++++++++++
   */
  const updateBPM = (bpm: number) => {
    if (!conductor.current) return;
    conductor.current.updateBPM(bpm);
  };

  /**
   * +++++++++++++++
   * EFFECT:
   * updates the current running conductor with new rhythm/polyrhythm parameters
   * +++++++++++++++
   */
  useEffect(() => {
    // conductor event callbacks
    const updateIsRunning = (state: boolean) => setIsRunning(state);
    const updateBPM = (newBPM: number) => {
      if (newBPM !== bpmRef.current) {
        setBPM(newBPM);
      }
    };

    // setup conductor if uninitialized
    if (!conductor.current) {
      conductor.current = initializeConductor();

      conductor.current.on('isRunning', updateIsRunning);
      conductor.current.on('updateBPM', updateBPM);
    }

    if (!conductor.current.isRunning) {
      conductor.current.removeRhythms();

      // base rhythm event callbacks
      const updateBeatChange = (beat: number) => setCurrentBeat(beat);
      const updateTotalBeatChange = (
        totalBeats: number,
      ): BeatState[] | null => {
        if (totalBeats === parseInt(beatCountRef.current.value)) return null;

        const newBeatCount = getBeatCount(totalBeats);
        const newBeatState = getBeatState(
          totalBeats,
          subdivisionRef.current.value,
        );

        beatCountRef.current = newBeatCount;
        setBeatCount(newBeatCount);
        setBeatCountGhost(null);

        totalBeatsRef.current = newBeatState;
        setTotalBeats(newBeatState);

        return newBeatState;
      };

      const baseSubdivision = getSubdivision(subdivision.value);
      const baseBeatCount = parseInt(beatCount.value);
      const baseBeatState = totalBeatsRef.current;
      const baseSound = new Oscillator(conductor.current.audioCtx, frequency);

      const baseRhythm = new Rhythm({
        subdivision: baseSubdivision,
        beats: baseBeatCount,
        state: baseBeatState,
        sound: baseSound,
      });

      conductor.current.addRhythm(baseRhythm);

      baseRhythm.on('beatChange', updateBeatChange);
      baseRhythm.on('updatedBeats', (updatedBeats: number) => {
        const state = updateTotalBeatChange(updatedBeats);
        if (state) {
          baseRhythm.resetState(state);
        }
      });
    }

    if (usePolyrhythm && conductor.current.numberOfRhythms !== 2) {
      // poly rhythm event callbacks
      const updateBeatChange = (beat: number) => setPolyBeat(beat);
      const updateTotalBeatChange = (
        totalBeats: number,
      ): BeatState[] | null => {
        const newBeatCount = getBeatCount(totalBeats);
        const newBeatState = getBeatState(
          totalBeats,
          polySubdivisionRef.current.value,
        );

        setPolyBeatCountGhost(null);
        setPolyBeatCount(newBeatCount);
        setTotalPolyBeats(newBeatState);

        return newBeatState;
      };

      const polySound = new Oscillator(
        conductor.current.audioCtx,
        polyFrequency,
      );
      const polySub = getSubdivision(polySubdivision.value);
      const polyState = totalPolyBeatsRef.current;
      const polyBeat = parseInt(beatCount.value);
      const polyTotalBeats = parseInt(polyBeatCount.value);

      const polyRhythm = new Rhythm({
        subdivision: polySub,
        sound: polySound,
        beats: polyBeat,
        poly: polyTotalBeats,
        state: polyState,
      });

      conductor.current.addRhythm(polyRhythm);

      polyRhythm.on('beatChange', updateBeatChange);

      polyRhythm.on('updatedBeats', (updatedBeats: number) => {
        const newBeatState = updateTotalBeatChange(updatedBeats);
        if (newBeatState) {
          polyRhythm.resetState(newBeatState);
        }
      });
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
      setBeatCountGhost(null);
      setPolyBeatCountGhost(null);
      releaseWakeLock();
    } else {
      conductor.current.start();
      requestWakeLock();
    }
  }

  function updateSubdivision(value: string): void {
    const newSubdivision =
      subdivisionData.find((s) => s.value === value) || subdivisionData[0];

    const newBeatState = getBeatState(
      parseInt(beatCount.value),
      newSubdivision.value,
    );

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);
      rhythm.resetState(newBeatState); // updates rhythm state
      rhythm.setSubdivision(getSubdivision(newSubdivision.value));
    }

    totalBeatsRef.current = newBeatState; // used in useEffect
    setTotalBeats(newBeatState); // updates UI
    setSubdivision(newSubdivision);
    subdivisionRef.current = newSubdivision;
  }

  function updatePolySubdivision(value: string): void {
    const newSubdivision =
      subdivisionData.find((s) => s.value === value) || subdivisionData[0];

    const newBeatState = getBeatState(
      parseInt(polyBeatCount.value),
      newSubdivision.value,
    );

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);
      rhythm.resetState(newBeatState); // updates rhythm state
      rhythm.setSubdivision(getSubdivision(newSubdivision.value));
    }

    totalPolyBeatsRef.current = newBeatState; // used in useEffect
    setTotalPolyBeats(newBeatState); // updates UI
    setPolySubdivision(newSubdivision);
    polySubdivisionRef.current = newSubdivision;
  }

  function updatefrequency(frequency: number): void {
    if (!conductor.current) return;

    const baseRhythm = conductor.current.getRhythm(0);
    baseRhythm.updateFrequency(frequency);

    setFrequency(frequency);
  }

  function updatePolyFrequency(frequency: number): void {
    if (!conductor.current) return;

    const baseRhythm = conductor.current.getRhythm(1);
    baseRhythm.updateFrequency(frequency);

    setPolyFrequency(frequency);
  }

  /**
   * +++++++++++
   * Update Total Base Rhythm Beats
   * +++++++++++
   */
  const [beatCountGhost, setBeatCountGhost] = useState<DropdownOptions | null>(
    null,
  );

  function updateBeatCount(value: string): void {
    const updatedBeatCount = parseInt(value);

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);

      conductor.current.updateBeats(updatedBeatCount);
      const newBeatCount = getBeatCount(parseInt(value));

      if (!isRunning) {
        const newBeatState = getBeatState(updatedBeatCount, subdivision.value);
        rhythm.resetState(newBeatState);

        beatCountRef.current = newBeatCount;
        totalBeatsRef.current = newBeatState;
        setTotalBeats(newBeatState);
        setBeatCount(newBeatCount);
      } else {
        setBeatCountGhost(newBeatCount);
      }
    }
  }

  /**
   * +++++++++++
   * Update Total Poly Beats
   * +++++++++++
   */
  const [polyBeatCountGhost, setPolyBeatCountGhost] =
    useState<DropdownOptions | null>(null);

  function updatePolyBeatCount(value: string): void {
    const updatedBeatCount = parseInt(value);

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);

      rhythm.updateBeats(updatedBeatCount, isRunning, 'poly');
      const newBeatCount = getBeatCount(parseInt(value));

      if (!isRunning) {
        const newBeatState = getBeatState(
          updatedBeatCount,
          polySubdivision.value,
        );

        rhythm.resetState(newBeatState);

        setTotalPolyBeats(newBeatState);
        setPolyBeatCount(newBeatCount);
      } else {
        setPolyBeatCountGhost(newBeatCount);
      }
    }
  }

  /**
   * +++++++++++
   * Poly Rhythm Toggle
   * +++++++++++
   */
  function updateUsePolyrhythm(usePoly: boolean): void {
    setUsePolyrhythm(usePoly);
    if (!usePoly && selectedSetting === 'polyrhythm') {
      setSelectedSetting('metronome');
    }

    if (!usePoly && isRunning && conductor.current) {
      conductor.current.getRhythm(1).kill();
      conductor.current.removeRhythm(1);
      setPolyBeat(1);
    }
  }

  function isMobileUserAgent() {
    const userAgent = navigator.userAgent;
    return /android|ipad|iphone|ipod|blackberry|webos|iemobile|mobile/i.test(
      userAgent,
    );
  }

  /**
   * +++++++++++
   * Fullscreen Toggle
   * +++++++++++
   */
  async function toggleFullscreen(): Promise<void> {
    if (!document.fullscreenElement) {
      try {
        document.documentElement.requestFullscreen();
      } catch (err) {
        console.log(err);
      }
    } else {
      document.exitFullscreen();
    }
  }

  /**
   * ++++++++++++++++++++
   * Beat Sequencer Click
   * ++++++++++++++++++++
   */
  const handleBeatClick = (i: number): void => {
    const state = Math.abs(totalBeats[i] - 1) as BeatState;
    setTotalBeats((prev) => {
      return prev.map((value, index) => (index === i ? state : value));
    });

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0); // base rhythm
      rhythm.updateState(i, state);
    }
  };

  /**
   * ++++++++++++++++++++++++++
   * Poly Beat Sequencer Click
   * ++++++++++++++++++++++++++
   */
  const handlePolyBeatClick = (i: number): void => {
    const state = Math.abs(totalPolyBeats[i] - 1) as BeatState;
    setTotalPolyBeats((prev) => {
      return prev.map((value, index) => (index === i ? state : value));
    });

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);
      rhythm.updateState(i, state);
    }
  };

  // move to hook
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') {
      if (conductor.current) {
        conductor.current.stop();
      }
      releaseWakeLock();
    }
  });

  return (
    <>
      <section className="metronome__outer-container">
        <Display
          isRunning={isRunning}
          bpm={bpm}
          beats={parseInt(beatCount.value)}
          currentBeat={currentBeat}
          polyrhythm={parseInt(polyBeatCount.value)}
          polyBeat={polyBeat}
          usePoly={usePolyrhythm}
          togglePlayback={toggleMetronome}
          updateBPM={updateBPM}
          subdivision={
            Subdivisions[subdivision.value as keyof typeof Subdivisions]
          }
          subdivisionIcon={subdivision.icon}
          polySubdivision={
            Subdivisions[polySubdivision.value as keyof typeof Subdivisions]
          }
          polySubdivisionIcon={polySubdivision.icon}
          handleBeatClick={handleBeatClick}
          handlePolyBeatClick={handlePolyBeatClick}
          totalBeats={totalBeats}
          totalPolyBeats={totalPolyBeats}
          beatCountGhost={
            beatCountGhost ? parseInt(beatCountGhost.value) : beatCountGhost
          }
          polyBeatCountGhost={
            polyBeatCountGhost
              ? parseInt(polyBeatCountGhost.value)
              : polyBeatCountGhost
          }
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
              currentValue={beatCountGhost ?? beatCount}
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
              onChange={updatefrequency}
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
              currentValue={polyBeatCountGhost ?? polyBeatCount}
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
              onChange={updatePolyFrequency}
            />
          </section>
        </div>
      )}

      {!isMobileUserAgent() && (
        <section className="settings-row">
          <div>
            <button onClick={toggleFullscreen}>fullscreen</button>
          </div>
        </section>
      )}
    </>
  );
}

export default App;
