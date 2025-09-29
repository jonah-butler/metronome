// import { useEffect, useRef } from 'react';

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
  // may not need this anymore
  // const clockArm = useRef<HTMLDivElement | null>(null);

  // // may not need this anymore
  // useEffect(() => {
  //   console.log('okk');
  //   if (!clockArm.current) return;

  //   if (!isRunning) {
  //     clockArm.current.style.transform = 'rotate(0deg) !important';
  //   }
  // }, [isRunning]);

  return (
    <section
      // ref={clockArm}
      className={`${isRunning ? 'running' : ''} grid-container__clock-arm`}
      style={{ '--tempo': `${(60 / bpm) * beats}s` } as React.CSSProperties}
    ></section>
  );
}
