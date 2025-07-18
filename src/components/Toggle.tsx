import '../css/Toggle.css';

interface ToggleProps {
  label?: string;
  isChecked: boolean;
  onChange: (value: boolean) => void;
}

function Toggle({ label, isChecked, onChange }: ToggleProps) {
  return (
    <div className="toggle-container">
      <div>{label}</div>
      <label className="switch">
        <input
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
