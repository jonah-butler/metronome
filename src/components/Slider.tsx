import '../css/Slider.css';

interface RangeProps {
  min: number;
  max: number;
  currentValue: number;
  step: number;
  label: string;
  onChange: (value: number) => void;
}

function Slider({ min, max, step, currentValue, onChange, label }: RangeProps) {
  return (
    <div className="range-container">
      <div>{label}</div>
      <section className="range">
        <input
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          value={currentValue}
          type="range"
        ></input>
      </section>
    </div>
  );
}

export default Slider;
