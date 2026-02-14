import { forwardRef } from 'react';
import PlusIcon from '../../assets/icons/plus.svg?react';
import '../../css/AddVertical.css';

type AddVerticalButtonProps = {
  text?: string;
  onClick: () => void;
};

const AddVerticalButton = forwardRef<HTMLDivElement, AddVerticalButtonProps>(
  ({ text = 'Add', onClick }, ref) => {
    return (
      <div ref={ref} className="vertical-button">
        <button onClick={onClick}>
          <PlusIcon style={{ color: 'var(--extra-light-gray)' }} />
          {text}
        </button>
      </div>
    );
  },
);

AddVerticalButton.displayName = 'AddVerticalButton';

export default AddVerticalButton;
