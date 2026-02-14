import { Route, Routes } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import Metronome from './pages/Metronome';
import RhythmBuilder from './pages/RhythmBuilder';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/metronome" element={<Metronome />} />
        <Route path="/builder" element={<RhythmBuilder />} />
      </Route>
    </Routes>
  );
}
