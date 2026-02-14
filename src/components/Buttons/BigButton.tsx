import { type ReactNode } from 'react';
import '../../css/BigButton.css';

type BigButtonProps = {
  icon?: ReactNode;
  header: string;
  description?: string;
  onClick: () => void;
};

export default function BigButton({
  icon,
  header,
  description,
  onClick,
}: BigButtonProps) {
  return (
    <div onClick={() => onClick()} className="big-button">
      <div className="big-button__container flex f-gap4">
        {icon ? <section className="left">{icon}</section> : null}
        <section className="right">
          <h3>{header}</h3>
          <p className="text-light font-size-13">{description}</p>
        </section>
      </div>
    </div>
  );
}
