import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StartGameScreen from './screens/StartGameScreen';
import ModeSelectionScreen from './screens/ModeSelectionScreen';
import PlayerSetupScreen from './screens/PlayerSetupScreen';
import GameSelectionScreen from './screens/GameSelectionScreen';
import CameraSetupScreen from './screens/CameraSetupScreen';
import PlayGameScreen from './screens/PlayGameScreen';
import VisionTestScreen from './screens/VisionTestScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import TermsScreen from './screens/TermsScreen';
import AboutScreen from './screens/AboutScreen';
import ContactScreen from './screens/ContactScreen';
import { GameSessionProvider } from './context/GameSessionContext';

export default function App() {
  return (
    <GameSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartGameScreen />} />
          <Route path="/mode" element={<ModeSelectionScreen />} />
          <Route path="/players" element={<PlayerSetupScreen />} />
          <Route path="/games" element={<GameSelectionScreen />} />
          <Route path="/camera" element={<CameraSetupScreen />} />
          <Route path="/play" element={<PlayGameScreen />} />
          <Route path="/vision-test" element={<VisionTestScreen />} />
          <Route path="/privacy" element={<PrivacyScreen />} />
          <Route path="/terms" element={<TermsScreen />} />
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/contact" element={<ContactScreen />} />
        </Routes>
      </BrowserRouter>
    </GameSessionProvider>
  );
}
