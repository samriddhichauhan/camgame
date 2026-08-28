import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StartGameScreen from './screens/StartGameScreen';
import PlayerSetupScreen from './screens/PlayerSetupScreen';
import GameSelectionScreen from './screens/GameSelectionScreen';
import CameraSetupScreen from './screens/CameraSetupScreen';
import { GameSessionProvider } from './context/GameSessionContext';

export default function App() {
  return (
    <GameSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartGameScreen />} />
          <Route path="/players" element={<PlayerSetupScreen />} />
          <Route path="/games" element={<GameSelectionScreen />} />
          <Route path="/camera" element={<CameraSetupScreen />} />
        </Routes>
      </BrowserRouter>
    </GameSessionProvider>
  );
}
