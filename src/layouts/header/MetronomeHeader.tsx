import { useNavigate } from 'react-router-dom';
import BuilderIcon from '../../assets/icons/builder.svg?react';

export default function MetronomeHeader() {
  const navigate = useNavigate();

  return (
    <section className="flex f-gap1">
      <button className="color-white" onClick={() => navigate('/builder')}>
        <BuilderIcon style={{ width: '18px' }} /> Builder
      </button>
    </section>
  );
}
