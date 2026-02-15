import { type MouseEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../css/BPM-Grid.css';
import { getBeatState } from '../services/rhythm.services';
import type { BeatState } from '../timing_engine/rhythm.types';
import { SubdivisionModal } from './Modals/Subdivision-Modal';

interface BPMGridProps {
  beats: number;
  currentBeat: number;
  smallVersion?: boolean;
  subdivision: number;
  totalBeats: BeatState[];
  beatCountGhost: number | null;
  handleBeatClick: (index: number) => void;
}

function BPMGrid({
  beats,
  currentBeat,
  smallVersion,
  subdivision,
  handleBeatClick,
  totalBeats,
  beatCountGhost,
}: BPMGridProps) {
  function isSubdividedNote(
    beats: number,
    beat: number,
    subdivision: number,
  ): boolean {
    return !Number.isInteger((beats / (beats / subdivision)) * beat);
  }

  function isSameBeat(i: number): boolean {
    return 1 + i * subdivision === currentBeat;
  }

  const PRESS_THRESHOLD = 1000;

  const pressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [longPress, setLongPress] = useState(false);

  type ModalCoordinates = {
    x: number;
    y: number;
  };

  const [coordinates, setCoordinates] = useState<ModalCoordinates>({
    x: 0,
    y: 0,
  });

  const handleMouseDown = (
    beat: number,
    event: MouseEvent<HTMLDivElement, Event>,
  ) => {
    setCoordinates({
      x: event.clientX,
      y: event.clientY,
    });

    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }

    pressTimer.current = setTimeout(() => {
      if (!isSubdividedNote(beats, beat, subdivision)) {
        setLongPress(true);
      }
    }, PRESS_THRESHOLD);
  };

  const handleMouseUp = (beat: number) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }

    if (!longPress) {
      handleBeatClick(beat);
      setLongPress(false);
    }
  };

  return (
    <>
      {beatCountGhost ? (
        <div
          className={`grid-container ghost ${smallVersion ? 'small' : ''}`}
          style={
            { '--beats': beatCountGhost / subdivision } as React.CSSProperties
          }
        >
          {getBeatState(beatCountGhost, subdivision).map((beat, i) => {
            return (
              <div
                className={`dot ${isSubdividedNote(beatCountGhost, i, subdivision) ? 'subdivision' : ''} ${beat === 0 ? 'off' : ''}`}
                key={i}
                style={{ '--i': i } as React.CSSProperties}
              ></div>
            );
          })}
        </div>
      ) : null}

      <div
        className={`grid-container ${smallVersion ? 'small' : ''}`}
        style={{ '--beats': beats / subdivision } as React.CSSProperties}
      >
        {totalBeats.map((beat, i) => {
          return (
            <div
              className={`dot${isSameBeat(i) ? ' active' : ''} ${isSubdividedNote(beats, i, subdivision) ? 'subdivision' : ''} ${beat === 0 ? 'off' : ''}`}
              key={i}
              style={{ '--i': i } as React.CSSProperties}
              // onClick={() => handleBeatClick(i)}
              onMouseDown={(event) => handleMouseDown(i, event)}
              onMouseUp={() => handleMouseUp(i)}
            ></div>
          );
        })}
        {createPortal(
          <SubdivisionModal
            isVisible={longPress}
            handleBlur={() => setLongPress(false)}
            coordinates={coordinates}
          />,
          document.body,
        )}
      </div>
    </>
  );
}

export default BPMGrid;
