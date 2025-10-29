import { useEffect, useRef } from 'react';

type MetronomeClockArmProps = {
  isRunning: boolean;
  bpm: number;
  beats: number;
};

export default function MetronomeClockArm({
  isRunning,
  bpm,
  beats,
}: MetronomeClockArmProps) {
  const clockArmRef = useRef<HTMLElement | null>(null);
  const clockArmAnimation = useRef<Animation | null>(null);

  useEffect(() => {
    if (!clockArmRef.current) return;

    if (!clockArmAnimation.current) {
      clockArmAnimation.current = clockArmRef.current.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        {
          duration: 1000,
          iterations: Infinity,
          easing: 'linear',
          fill: 'both',
        },
      );
    }

    if (isRunning) {
      clockArmAnimation.current.play();
    } else {
      resetClockArm();
    }

    // on unmount cleanup
    return () => clockArmAnimation.current?.cancel();
  }, [isRunning]);

  useEffect(() => {
    if (!clockArmAnimation.current) return;

    const secondsPerRev = (60 / bpm) * beats;

    clockArmAnimation.current.playbackRate = 1 / secondsPerRev;
  }, [bpm, beats]);

  const resetClockArm = (): void => {
    if (!clockArmRef.current) return;
    if (!clockArmAnimation.current) return;

    clockArmAnimation.current.pause();
    clockArmAnimation.current.cancel();
    clockArmRef.current.style.transform = 'rotate(0deg)';
  };

  return <section ref={clockArmRef} className="grid-container__clock-arm" />;
}
