import '../css/Dropdown.css';

export type DropdownOptions = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

interface DropdownProps {
  data: DropdownOptions[];
  label: string;
  currentValue: DropdownOptions;
  onChange: (value: string) => void;
}

function Dropdown({ data, label, currentValue, onChange }: DropdownProps) {
  return (
    <div className="dropdown-container">
      <div className="dropdown-label-container">{label}</div>
      <div></div>
      <select
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
