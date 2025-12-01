import { useEffect, useRef, useState } from 'react';
import './App.css';
import Display from './components/Display';
import Dropdown, { type DropdownOptions } from './components/Dropdown';
import Slider from './components/Slider';
import Toggle from './components/Toggle';
import { beatCountData, subdivisionData } from './data';
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
  // useEffect(() => {
  //   if (!conductor.current) return;
  //   conductor.current.update(bpm);

  //   // setIsRunning(false);
  //   // setTimeout(() => {
  //   //   if (!conductor.current) return;

  //   //   conductor.current.update(bpm);
  //   // }, 50);
  // }, [bpm]);

  // Alternative to updating BPM
  const updateBPM = (bpm: number) => {
    if (!conductor.current) return;
    conductor.current.updateBPM(bpm);
  };

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

  const lastBeatTimeRef = useRef(0);
  const lastBeatTrackRef = useRef(1);

  useEffect(() => {
    if (!conductor.current) {
      const audioCtx = new AudioContext();
      conductor.current = new Conductor({ audioCtx, bpm: defaultBpm });

      conductor.current.on('isRunning', (state: boolean): void => {
        setIsRunning(state);
      });

      conductor.current.on('updateBPM', (newBPM: number) => {
        if (newBPM !== bpmRef.current) {
          setBPM(newBPM);
        }
      });

      conductor.current.on(
        'beat',
        ({
          beatTrack,
          scheduledTime,
        }: {
          beatTrack: number;
          scheduledTime: number;
        }) => {
          lastBeatTimeRef.current = scheduledTime;
          lastBeatTrackRef.current = beatTrack;
        },
      );
    }
    const osc = new Oscillator(conductor.current.audioCtx, frequency);

    if (!isRunning) {
      conductor.current.removeRhythms();
      // const sound3 = new Oscillator(conductor.current.audioCtx, 100);
      // const sound4 = new Oscillator(conductor.current.audioCtx, 300);
      // const sound5 = new Oscillator(conductor.current.audioCtx, 1000);
      // const sound6 = new Oscillator(conductor.current.audioCtx, 3000);

      // const rhythm3 = new Rhythm({
      //   subdivision:
      //     Subdivisions[subdivisionData[0].value as keyof typeof Subdivisions],
      //   sound: sound3,
      //   beats: 4,
      //   state: [0, 1, 1, 1],
      // });

      // const rhythm4 = new Rhythm({
      //   subdivision:
      //     Subdivisions[subdivisionData[1].value as keyof typeof Subdivisions],
      //   sound: sound4,
      //   beats: 4,
      //   state: [0, 1, 0, 1, 0, 1, 0, 1],
      // });

      // const rhythm5 = new Rhythm({
      //   subdivision:
      //     Subdivisions[subdivisionData[2].value as keyof typeof Subdivisions],
      //   sound: sound5,
      //   beats: 4,
      //   state: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      // });

      // const rhythm6 = new Rhythm({
      //   subdivision:
      //     Subdivisions[subdivisionData[3].value as keyof typeof Subdivisions],
      //   sound: sound6,
      //   beats: 4,
      //   state: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      // });

      const updateRhythm = new Rhythm({
        subdivision:
          Subdivisions[subdivision.value as keyof typeof Subdivisions],
        sound: osc,
        beats: parseInt(beatCount.value),
        state: totalBeatsRef.current,
      });

      conductor.current.addRhythm(updateRhythm);
      // conductor.current.addRhythm(rhythm3);
      // conductor.current.addRhythm(rhythm4);
      // conductor.current.addRhythm(rhythm5);
      // conductor.current.addRhythm(rhythm6);

      updateRhythm.on('beatChange', (beat: number) => {
        setCurrentBeat(beat);
      });

      // clean this up soon
      updateRhythm.on('updatedBeats', (updatedBeats: number) => {
        if (updatedBeats !== parseInt(beatCountRef.current.value)) {
          beatCountRef.current =
            beatCountData.find((b) => b.value === updatedBeats.toString()) ||
            beatCountData[3];
          const newTotalBeats: BeatState[] = new Array(
            updatedBeats /
              Subdivisions[
                subdivisionRef.current.value as keyof typeof Subdivisions
              ],
          ).fill(1);

          updateRhythm.resetState(newTotalBeats);

          totalBeatsRef.current = newTotalBeats;
          setTotalBeats(newTotalBeats);
          setBeatCount(
            beatCountData.find((b) => b.value === updatedBeats.toString()) ||
              beatCountData[3],
          );
        }
      });
    }

    if (usePolyrhythm && conductor.current.numberOfRhythms !== 2) {
      const polyOsc = new Oscillator(conductor.current.audioCtx, polyFrequency);

      const polyRhythm = new Rhythm({
        subdivision:
          Subdivisions[polySubdivision.value as keyof typeof Subdivisions],
        sound: polyOsc,
        beats: parseInt(beatCount.value),
        poly: parseInt(polyBeatCount.value),
        state: totalPolyBeatsRef.current,
      });

      conductor.current.addRhythm(polyRhythm);

      polyRhythm.on('beatChange', (beat: number): void => {
        setPolyBeat(beat);
      });

      polyRhythm.on('updatedBeats', (updatedBeats: number) => {
        // update this, polySubdivision not up to date
        const newTotalBeats: BeatState[] = new Array(
          updatedBeats /
            Subdivisions[
              polySubdivisionRef.current.value as keyof typeof Subdivisions
            ],
        ).fill(1);

        polyRhythm.resetState(newTotalBeats);
        setTotalPolyBeats(newTotalBeats);
        setPolyBeatCount(
          beatCountData.find((b) => b.value === updatedBeats.toString()) ||
            beatCountData[3],
        );
      });
    }

    // if (isRunningRef.current) {
    //   setIsRunning(false);

    //   setTimeout(() => {
    //     if (!conductor.current) return;

    //     // set is running to keep current isRunning state up to date
    //     conductor.current.start().then((isRunning) => setIsRunning(isRunning));
    //   }, 50);
    // }
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
      releaseWakeLock();
    } else {
      conductor.current.start();
      requestWakeLock();
    }
  }

  function updateSubdivision(value: string): void {
    const newSubdivision =
      subdivisionData.find((s) => s.value === value) || subdivisionData[0];

    const newTotalBeats = new Array(
      parseInt(beatCount.value) /
        Subdivisions[newSubdivision.value as keyof typeof Subdivisions],
    ).fill(1);

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);
      rhythm.resetState(newTotalBeats); // updates rhythm state
      rhythm.setSubdivision(
        Subdivisions[newSubdivision.value as keyof typeof Subdivisions],
      );
    }

    totalBeatsRef.current = newTotalBeats; // used in useEffect
    setTotalBeats(newTotalBeats); // updates UI
    setSubdivision(newSubdivision);
    subdivisionRef.current = newSubdivision;
  }

  function updatePolySubdivision(value: string): void {
    const newSubdivision =
      subdivisionData.find((s) => s.value === value) || subdivisionData[0];

    const newTotalBeats = new Array(
      parseInt(polyBeatCount.value) /
        Subdivisions[newSubdivision.value as keyof typeof Subdivisions],
    ).fill(1);

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);
      rhythm.resetState(newTotalBeats); // updates rhythm state
      rhythm.setSubdivision(
        Subdivisions[newSubdivision.value as keyof typeof Subdivisions],
      );
    }

    totalPolyBeatsRef.current = newTotalBeats; // used in useEffect
    setTotalPolyBeats(newTotalBeats); // updates UI
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

  // UPDATE BEAT COUNT - BASE
  function updateBeatCount(value: string): void {
    const updatedBeatCount = parseInt(value);

    // generate new BeatState
    // const newTotalBeats: BeatState[] = new Array(
    //   updatedBeatCount /
    //     Subdivisions[subdivision.value as keyof typeof Subdivisions],
    // ).fill(1);

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(0);
      // reset rhythm's beat state
      // rhythm.resetState(newTotalBeats);

      conductor.current.updateBeats(updatedBeatCount);
      if (!isRunning) {
        const newTotalBeats: BeatState[] = new Array(
          updatedBeatCount /
            Subdivisions[subdivision.value as keyof typeof Subdivisions],
        ).fill(1);
        rhythm.resetState(newTotalBeats);

        beatCountRef.current =
          beatCountData.find((b) => b.value === value) || beatCountData[3];
        totalBeatsRef.current = newTotalBeats;
        setTotalBeats(newTotalBeats);
        setBeatCount(
          beatCountData.find((b) => b.value === value) || beatCountData[3],
        );
      }
      // rhythm.updateBeats(updatedBeatCount);
    }

    // beatCountRef.current =
    //   beatCountData.find((b) => b.value === value) || beatCountData[3];
    // totalBeatsRef.current = newTotalBeats;
    // setTotalBeats(newTotalBeats);
    // setBeatCount(
    //   beatCountData.find((b) => b.value === value) || beatCountData[3],
    // );
  }

  function updatePolyBeatCount(value: string): void {
    const updatedBeatCount = parseInt(value);

    // const newTotalBeats = new Array(
    //   parseInt(value) /
    //     Subdivisions[polySubdivision.value as keyof typeof Subdivisions],
    // ).fill(1);

    if (conductor.current) {
      const rhythm = conductor.current.getRhythm(1);
      // rhythm.resetState(newTotalBeats);
      // conductor.current.updateBeats(rhythm, updatedBeatCount);
      rhythm.updateBeats(updatedBeatCount, isRunning, 'poly');
      if (!isRunning) {
        const newTotalBeats: BeatState[] = new Array(
          updatedBeatCount /
            Subdivisions[polySubdivision.value as keyof typeof Subdivisions],
        ).fill(1);
        rhythm.resetState(newTotalBeats);

        // beatCountRef.current =
        //   beatCountData.find((b) => b.value === value) || beatCountData[3];
        // totalBeatsRef.current = newTotalBeats;
        setTotalPolyBeats(newTotalBeats);
        setPolyBeatCount(
          beatCountData.find((b) => b.value === value) || beatCountData[3],
        );
      }
    }

    // totalPolyBeatsRef.current = newTotalBeats;
    // setTotalPolyBeats(newTotalBeats);
    // setPolyBeatCount(
    //   beatCountData.find((b) => b.value === value) || beatCountData[3],
    // );
  }

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
   * Fullscreen
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
      const rhythm = conductor.current.getRhythm(0);
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
        {/* <div className="absolute-note-container">
          <span>{subdivision.icon}</span>
          {usePolyrhythm && <span>{polySubdivision.icon}</span>}
        </div> */}
        <Display
          isRunning={isRunning}
          bpm={bpm}
          beats={parseInt(beatCount.value)}
          currentBeat={currentBeat}
          polyrhythm={parseInt(polyBeatCount.value)}
          polyBeat={polyBeat}
          usePoly={usePolyrhythm}
          togglePlayback={toggleMetronome}
          // updateBPM={setBPM}
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
          lastBeatTime={lastBeatTimeRef.current}
          audioCtx={conductor.current?.audioCtx}
        />
      </section>
      {/* <section className="spinner-container" style={{ display: 'none' }}>
        <BPMSpinner
          togglePlayback={toggleMetronome}
          bpm={bpm}
          isRunning={isRunning}
          updateBPM={setBPM}
          usePolyrhythm={usePolyrhythm}
        />
      </section> */}
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
