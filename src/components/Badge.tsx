import { type ReactNode } from 'react';
import '../css/Badge.css';

type BadgeProps = {
  icon?: ReactNode;
  text: string;
};

export default function Badge({ icon, text }: BadgeProps) {
  return (
    <section className="badge flex f-gap2 justify-center">
      {icon ? <span>{icon}</span> : null}
      <span>{text}</span>
    </section>
  );
}
