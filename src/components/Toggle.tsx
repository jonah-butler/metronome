import '../css/Toggle.css';

interface ToggleProps {
  label?: string;
  isChecked: boolean;
  variant?: 'small' | 'regular';
  onChange: (value: boolean) => void;
}

function Toggle({
  label,
  isChecked,
  onChange,
  variant = 'regular',
}: ToggleProps) {
  return (
    <div className="toggle-input">
      <div>{label}</div>
      <label className={`switch ${variant}`}>
        <input
          className={variant}
          name="toggle"
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider round"></span>
      </label>
    </div>
  );
}

export default Toggle;
