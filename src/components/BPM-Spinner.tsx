import { useRef, useState, type PointerEvent as PE } from 'react';
import PowerButton from '../assets/power-button.svg?react';
import '../css/BPM-Spinner.css';

interface BPMSpinnerProps {
  bpm: number;
  isRunning: boolean;
  updateBPM: (value: number) => void;
  togglePlayback: () => void;
}

function BPMSpinner({
  bpm,
  isRunning,
  updateBPM,
  togglePlayback,
}: BPMSpinnerProps) {
  const [rotation, setRotation] = useState(0);
  const [count, setCount] = useState(bpm);
  const [styleCount, setStyleCount] = useState(bpm);
  const countRef = useRef(count);
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

      accumulatedDelta += delta * 0.09;

      if (Math.abs(accumulatedDelta) >= 1) {
        const change = Math.round(accumulatedDelta);
        setCount((prev) => {
          const next = clamp(prev + change, 20, 250);
          countRef.current = next;
          return next;
        });

        accumulatedDelta -= change;
      }
      startAngle = newAngle;
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      updateBPM(countRef.current);
      setStyleCount(countRef.current);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }

  return (
    <div className="bpm-spinner">
      <section
        ref={bpmSpinnerRef}
        onPointerDown={onPointerDown}
        className="bpm-spinner__rotary"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className="circle">
          <div>
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <div>
                        <div>
                          <div>
                            <div>
                              <div>
                                <div>
                                  <div>
                                    <div>
                                      <div>
                                        <div>
                                          <div>
                                            <div>
                                              <div>
                                                <div></div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div
        className={`${isRunning ? 'running ' : ''}bpm-spinner__button`}
        style={{ '--tempo': `${60 / styleCount}s` } as React.CSSProperties}
      >
        <div>
          <h4>{count}</h4>
          <h5>BPM</h5>
        </div>

        <div className="play-button__container">
          <button onClick={togglePlayback} className="play-button">
            <PowerButton />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BPMSpinner;
