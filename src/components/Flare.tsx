import '../css/Flare.css';

type FlareProps = {
  x: number;
  y: number;
};

export default function Flare({ x, y }: FlareProps) {
  return (
    <div className="flare" style={{ top: y, left: x }}>
      <div>
        <div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
