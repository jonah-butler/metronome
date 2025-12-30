import { useEffect, useRef, useState } from 'react';
import './App.css';
import BeatGridSettings from './assets/icons/beat-grid-settings.svg?react';
import SoundSettings from './assets/icons/sound-settings.svg?react';
import Display from './components/Display';
import Dropdown, { type DropdownOptions } from './components/Dropdown';
import Slider from './components/Slider';
import { Tabs } from './components/Tabs/Tabs';
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
  const [frequencyData, setFrequencyData] = useState({
    frequency: defaultFrequency,
    beatOneOffset: 200,
    subdividedOffset: -50,
    gain: 0.5,
  });
  // const [frequency, setFrequency] = useState(defaultFrequency); // retire

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
  const [polyFrequencyData, setPolyFrequencyData] = useState({
    frequency: 550,
    beatOneOffset: 200,
    subdividedOffset: -50,
    gain: 0.5,
  });
  // const [polyFrequency, setPolyFrequency] = useState(550); // retire
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
  const [tab, setTab] = useState(0);
  // const [polyTab, setPolyTab] = useState(0);
  // const [usePolyrhythmTrainer, setUsePolyrhythmTrainer] = useState(false);

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

    if (
      !conductor.current.isRunning &&
      conductor.current.numberOfRhythms === 0
    ) {
      conductor.current.removeRhythms();

      // base rhythm event callbacks
      const updateBeatChange = (beat: number) => {
        setCurrentBeat(beat);
      };
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
      const baseSound = new Oscillator(
        conductor.current.audioCtx,
        frequencyData.frequency,
        frequencyData.beatOneOffset,
        frequencyData.subdividedOffset,
        frequencyData.gain,
      );

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
      const updateBeatChange = (beat: number) => {
        setPolyBeat(beat);
      };
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
        polyFrequencyData.frequency,
        polyFrequencyData.beatOneOffset,
        polyFrequencyData.subdividedOffset,
        polyFrequencyData.gain,
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

      // handle new rhythms when base rhythm
      // has a pending beat change so rhythms
      // are synced on beat 1
      const pendingBeatChange =
        conductor.current.getRhythm(0).pendingBeatChange;

      conductor.current.addRhythm(polyRhythm);

      if (pendingBeatChange) {
        polyRhythm.updateBeats(pendingBeatChange, isRunningRef.current, 'base');
      }

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
    frequencyData,
    usePolyrhythm,
    polyBeatCount,
    polyFrequencyData,
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

  function updateFrequencyData(
    value: number,
    key: keyof typeof polyFrequencyData,
  ): void {
    if (!conductor.current) return;

    const baseRhythm = conductor.current.getRhythm(0);

    setFrequencyData((prev) => {
      const next = { ...prev, [key]: value };
      baseRhythm.updateFrequencyData(next);
      return next;
    });
  }

  function updatePolyFrequencyData(
    value: number,
    key: keyof typeof polyFrequencyData,
  ): void {
    if (!conductor.current) return;

    const baseRhythm = conductor.current.getRhythm(1);

    setPolyFrequencyData((prev) => {
      const next = { ...prev, [key]: value };
      baseRhythm.updateFrequencyData(next);
      return next;
    });
  }

  /**
   * +++++++++++
   * Update Total Base Rhythm Beats
   * +++++++++++
   */
  const [beatCountGhost, setBeatCountGhost] = useState<DropdownOptions | null>(
    null,
  );

  function handleBeatCountChange(update: number): void {
    const updatedBeat = parseInt((beatCountGhost ?? beatCount).value) + update;
    if (updatedBeat < 1 || updatedBeat > 11) return;

    updateBeatCount(updatedBeat.toString());
  }

  function handlePolyBeatCountChange(update: number): void {
    const updatedBeat =
      parseInt((polyBeatCountGhost ?? polyBeatCount).value) + update;
    if (updatedBeat < 1 || updatedBeat > 11) return;

    updatePolyBeatCount(updatedBeat.toString());
  }

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

    if (!usePoly && conductor.current) {
      conductor.current.getRhythm(1).kill();
      conductor.current.removeRhythm(1);
      // setPolyBeat(1);
    }
  }

  /**
   * +++++++++++
   * Poly Rhythm Training Toggle
   * +++++++++++
   */
  // function updateUsePolyrhythmToggle(usePoly: boolean): void {
  //   setUsePolyrhythm(usePoly);
  //   if (!usePoly && selectedSetting === 'polyrhythm') {
  //     setSelectedSetting('metronome');
  //   }

  //   if (!usePoly && conductor.current) {
  //     conductor.current.getRhythm(1).kill();
  //     conductor.current.removeRhythm(1);
  //     // setPolyBeat(1);
  //   }
  // }

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
      <section className="settings-toggle-row">
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

      {/* Metronome Settings */}
      <Tabs index={tab} updateTab={setTab}>
        <Tabs.Tab label={<BeatGridSettings />}>
          <div className="flex">
            {/* Beat Count */}
            <section className="flex width-100 space-between align-center">
              <div className="text-light">beats per measure</div>
              <div className="flex">
                <button
                  disabled={(beatCountGhost ?? beatCount).value === '1'}
                  className="mr-2"
                  onClick={() => handleBeatCountChange(-1)}
                >
                  &#8722;
                </button>
                <Dropdown
                  variant="small"
                  data={beatCountData}
                  currentValue={beatCountGhost ?? beatCount}
                  onChange={updateBeatCount}
                />
                <button
                  disabled={(beatCountGhost ?? beatCount).value === '11'}
                  className="ml-2"
                  onClick={() => handleBeatCountChange(1)}
                >
                  &#43;
                </button>
              </div>
            </section>

            {/* Subdivision */}
            <section className="flex width-100 space-between align-center">
              <div className="text-light">subdivision</div>
              <div className="flex">
                <Dropdown
                  variant="small"
                  data={subdivisionData}
                  currentValue={subdivision}
                  onChange={updateSubdivision}
                />
              </div>
            </section>

            {/* use poly rhyhtm */}
            <section className="flex width-100 space-between align-center">
              <div className="flex flex-col text-left">
                <span className="font-size-12 font-weight-bold">
                  Polyrhythm
                </span>
                <span className="text-light">Layer a second rhythm</span>
              </div>
              <div className="flex">
                <Toggle
                  label=""
                  variant="small"
                  isChecked={usePolyrhythm}
                  onChange={updateUsePolyrhythm}
                />
              </div>
            </section>

            {/* polyrhythm settings */}
            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light">poly beats per measure</div>
                <div className="flex">
                  <button
                    disabled={
                      (polyBeatCountGhost ?? polyBeatCount).value === '1'
                    }
                    className="mr-2"
                    onClick={() => handlePolyBeatCountChange(-1)}
                  >
                    &#8722;
                  </button>
                  <Dropdown
                    variant="small"
                    data={beatCountData}
                    currentValue={polyBeatCountGhost ?? polyBeatCount}
                    onChange={updatePolyBeatCount}
                  />
                  <button
                    disabled={
                      (polyBeatCountGhost ?? polyBeatCount).value === '11'
                    }
                    className="ml-2"
                    onClick={() => handlePolyBeatCountChange(1)}
                  >
                    &#43;
                  </button>
                </div>
              </section>
            )}

            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light">subdivision</div>
                <div className="flex">
                  <Dropdown
                    variant="small"
                    data={subdivisionData}
                    currentValue={polySubdivision}
                    onChange={updatePolySubdivision}
                  />
                </div>
              </section>
            )}
          </div>
        </Tabs.Tab>
        <Tabs.Tab label={<SoundSettings />}>
          {/* Frequency Sliders */}
          <div className="flex">
            <section className="flex width-100 space-between align-center">
              <div className="text-light">gain</div>
              <div className="flex">
                <Slider
                  min={0.1}
                  max={1}
                  step={0.1}
                  label=""
                  currentValue={frequencyData.gain}
                  onChange={(value: number) =>
                    updateFrequencyData(value, 'gain')
                  }
                />
              </div>
            </section>

            <section className="flex width-100 space-between align-center">
              <div className="text-light">frequency</div>
              <div className="flex">
                <Slider
                  min={100}
                  max={1500}
                  step={10}
                  label=""
                  currentValue={frequencyData.frequency}
                  onChange={(value: number) =>
                    updateFrequencyData(value, 'frequency')
                  }
                />
              </div>
            </section>

            <section className="flex width-100 space-between align-center">
              <div className="text-light">beat one pitch</div>
              <div className="flex">
                <Slider
                  min={-100}
                  max={100}
                  step={1}
                  label=""
                  currentValue={frequencyData.beatOneOffset}
                  onChange={(value: number) =>
                    updateFrequencyData(value, 'beatOneOffset')
                  }
                />
              </div>
            </section>

            <section className="flex width-100 space-between align-center">
              <div className="text-light">subdivided pitch</div>
              <div className="flex">
                <Slider
                  min={-50}
                  max={50}
                  step={1}
                  label=""
                  currentValue={frequencyData.subdividedOffset}
                  onChange={(value: number) =>
                    updateFrequencyData(value, 'subdividedOffset')
                  }
                />
              </div>
            </section>

            {/* use poly rhyhtm */}
            <section className="flex width-100 space-between align-center">
              <div className="flex flex-col text-left">
                <span className="font-size-12 font-weight-bold">
                  Polyrhythm
                </span>
                <span className="text-light">Layer a second rhythm</span>
              </div>
              <div className="flex">
                <Toggle
                  label=""
                  variant="small"
                  isChecked={usePolyrhythm}
                  onChange={updateUsePolyrhythm}
                />
              </div>
            </section>

            {/* Poly Frequency Sliders */}
            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light">gain</div>
                <div className="flex">
                  <Slider
                    min={0.1}
                    max={1}
                    step={0.1}
                    label=""
                    currentValue={polyFrequencyData.gain}
                    onChange={(value: number) =>
                      updatePolyFrequencyData(value, 'gain')
                    }
                  />
                </div>
              </section>
            )}

            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light">frequency</div>
                <div className="flex">
                  <Slider
                    min={100}
                    max={1500}
                    step={10}
                    label=""
                    currentValue={polyFrequencyData.frequency}
                    onChange={(value: number) =>
                      updatePolyFrequencyData(value, 'frequency')
                    }
                  />
                </div>
              </section>
            )}

            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light">beat one pitch</div>
                <div className="flex">
                  <Slider
                    min={-100}
                    max={100}
                    step={1}
                    label=""
                    currentValue={polyFrequencyData.beatOneOffset}
                    onChange={(value: number) =>
                      updatePolyFrequencyData(value, 'beatOneOffset')
                    }
                  />
                </div>
              </section>
            )}

            {usePolyrhythm && (
              <section className="flex width-100 space-between align-center indented">
                <div className="text-light">subdivided pitch</div>
                <div className="flex">
                  <Slider
                    min={-50}
                    max={50}
                    step={1}
                    label=""
                    currentValue={polyFrequencyData.subdividedOffset}
                    onChange={(value: number) =>
                      updatePolyFrequencyData(value, 'subdividedOffset')
                    }
                  />
                </div>
              </section>
            )}
          </div>
        </Tabs.Tab>
      </Tabs>

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
