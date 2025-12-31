import '../css/Dropdown.css';

export type DropdownOptions = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

interface DropdownProps {
  data: DropdownOptions[];
  label?: string;
  currentValue: DropdownOptions;
  disabled?: boolean;
  variant?: 'small' | 'medium' | 'large' | 'full';
  onChange: (value: string) => void;
}

function Dropdown({
  data,
  label,
  currentValue,
  onChange,
  disabled = false,
  variant = 'medium',
}: DropdownProps) {
  return (
    <div className={`dropdown ${variant}`}>
      <div className="dropdown__label-container">{label}</div>
      <div></div>
      <select
        className={variant}
        disabled={disabled}
        value={currentValue.value}
        onChange={(e) => onChange(e.target.value)}
      >
        {data.map((select) => {
          return (
            <option key={select.value} value={select.value}>
              {select.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default Dropdown;
