import { useEffect, useRef, useState } from 'react';
import '../../css/Subdivision-Modal.css';
import { subdivisionData } from '../../data';
import Dropdown from '../Dropdown';

type SubdivisionModalProps = {
  coordinates: {
    x: number;
    y: number;
  };
  isVisible: boolean;
  handleBlur: () => void;
};

export function SubdivisionModal({
  isVisible,
  handleBlur,
  coordinates,
}: SubdivisionModalProps) {
  const modal = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    requestAnimationFrame(() => {
      modal.current?.focus();
    });
  }, [isVisible]);

  // console.log('restting');
  const [selectedValue, setSelectedValue] = useState(subdivisionData[0]);

  const handleChange = (value: string): void => {
    handleBlur();
    const newValue = subdivisionData.filter((data) => data.value === value)[0];
    console.log(newValue);
    setSelectedValue(newValue);
  };

  return (
    <div
      ref={modal}
      className="subdivision-modal"
      style={{
        display: isVisible ? 'block' : 'none',
        top: `${coordinates.y}px`,
        left: `${coordinates.x}px`,
      }}
      onBlur={(e) => {
        if (!modal.current?.contains(e.relatedTarget as Node)) {
          handleBlur();
        }
      }}
      tabIndex={-1}
    >
      <Dropdown
        label=""
        data={subdivisionData}
        currentValue={selectedValue}
        onChange={handleChange}
      />
    </div>
  );
}
