import { useEffect, useRef, useState, type PointerEvent as PE } from 'react';
import '../css/BPM-Spinner.css';

interface BPMSpinnerProps {
  bpm: number;
  updateBPM: (value: number) => void;
}

function BPMSpinner({ bpm, updateBPM }: BPMSpinnerProps) {
  const [rotation, setRotation] = useState(0);
  const [count, setCount] = useState(bpm);
  const bpmSpinnerRef = useRef<HTMLDivElement | null>(null);

  let startAngle = 0;

  function getAngleFromCenter(x: number, y: number) {
    if (!bpmSpinnerRef.current) return 0;
    const rect = bpmSpinnerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
    return (angle + 360) % 360;
  }

  function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  function onPointerDown(e: PE<HTMLDivElement>) {
    e.preventDefault();
    startAngle = getAngleFromCenter(e.clientX, e.clientY);

    let accumulatedDelta = 0;

    const handleMove = (ev: PointerEvent) => {
      const newAngle = getAngleFromCenter(ev.clientX, ev.clientY);
      let delta = newAngle - startAngle;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      setRotation((prev) => {
        const next = prev + delta;
        return ((next % 360) + 360) % 360;
      });

      accumulatedDelta += delta * 0.05;

      if (Math.abs(accumulatedDelta) >= 1) {
        const change = Math.round(accumulatedDelta);
        setCount((prev) => {
          const next = clamp(prev + change, 1, 350);
          return next;
        });

        accumulatedDelta -= change;
      }
      startAngle = newAngle;
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }

  useEffect(() => {
    updateBPM(count);
  }, [count, updateBPM]);

  return (
    <>
      <section
        ref={bpmSpinnerRef}
        onPointerDown={onPointerDown}
        className="bpm-spinner_container"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        BPM: {count}
      </section>
      <div className="bpm-spinner"></div>
    </>
  );
}

export default BPMSpinner;
