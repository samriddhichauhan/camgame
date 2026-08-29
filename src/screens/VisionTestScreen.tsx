import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraPreview from '../components/CameraPreview';
import VisionDebugOverlay from '../vision/debug/VisionDebugOverlay';
import { useVisionSystem } from '../vision/useVisionEngine';

/**
 * Standalone vision pipeline test page. Tests camera + person detection +
 * pose estimation + tracking in isolation, with no game logic involved.
 * See VISION TEST CASES in the rebuild spec for the manual test matrix
 * this page is meant to be run against.
 */
export default function VisionTestScreen() {
  const navigate = useNavigate();
  const [requiredPlayers, setRequiredPlayers] = useState<1 | 2>(2);
  const { phase, isReady, stream, starting, error, message, retry } = useVisionSystem(requiredPlayers);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center bg-slate-950 text-white p-4 sm:p-8 gap-4">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-mono font-bold uppercase tracking-wider"
        >
          ← Exit Test
        </button>
        <h1 className="font-mono font-black text-lg uppercase tracking-widest">/vision-test</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setRequiredPlayers(1)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase ${requiredPlayers === 1 ? 'bg-brand-purple' : 'bg-slate-800'}`}
          >
            1 Player
          </button>
          <button
            onClick={() => setRequiredPlayers(2)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold uppercase ${requiredPlayers === 2 ? 'bg-brand-purple' : 'bg-slate-800'}`}
          >
            2 Players
          </button>
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center gap-3">
        <div className="text-center">
          <div className="font-mono font-black text-2xl uppercase">{message.title}</div>
          <div className="font-mono text-xs text-slate-400 uppercase">{message.subtitle}</div>
        </div>

        {starting && !error && (
          <div className="font-mono text-xs text-yellow-400 animate-pulse">Loading camera + vision models...</div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-2 p-4 bg-red-950 border border-red-500 rounded-xl">
            <span className="font-mono text-xs text-red-300">{error.type === 'camera' ? 'Camera permission is required.' : 'Camera detection unavailable.'}</span>
            <button onClick={retry} className="px-4 py-1.5 bg-red-500 rounded-lg text-xs font-mono font-bold uppercase">Retry</button>
          </div>
        )}

        <div className="relative w-full max-w-xl">
          <CameraPreview stream={stream} />
          <VisionDebugOverlay requiredPlayers={requiredPlayers} />
        </div>

        <div className={`px-4 py-1.5 rounded-full font-mono font-bold text-xs uppercase tracking-wider ${isReady ? 'bg-green-600' : 'bg-slate-700'}`}>
          Phase: {phase} {isReady ? '· READY' : ''}
        </div>
      </div>
    </div>
  );
}
