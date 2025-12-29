import { useState } from 'react';
import '../css/Panel.css';
import { Drawer } from './Drawer/Drawer';

export function Trainer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="panel">
      <button onClick={() => setIsOpen(!isOpen)} className="wide outline">
        Training Mode
      </button>
      <Drawer
        isOpen={isOpen}
        handleClose={() => {
          setIsOpen(false);
        }}
      >
        <section>hey</section>
      </Drawer>
    </section>
  );
}
