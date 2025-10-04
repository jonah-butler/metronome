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
  return (
    <section
      className={`${isRunning ? 'running' : ''} grid-container__clock-arm`}
      style={{ '--tempo': `${(60 / bpm) * beats}s` } as React.CSSProperties}
    ></section>
  );
}
