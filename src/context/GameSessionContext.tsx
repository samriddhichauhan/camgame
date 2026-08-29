import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type GameMode = 'SINGLE_PLAYER' | 'TWO_PLAYERS';

export interface Player {
  name: string;
  avatar: string;
  color: string;
}

export interface GameSessionContextType {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  player1: Player;
  player2: Player;
  selectedGameId: string | null;
  setPlayer1Name: (name: string) => void;
  setPlayer1Avatar: (avatar: string) => void;
  setPlayer2Name: (name: string) => void;
  setPlayer2Avatar: (avatar: string) => void;
  setSelectedGameId: (gameId: string | null) => void;
  isSessionReady: () => boolean;
  resetSession: () => void;
}

const defaultPlayer1: Player = { name: '', avatar: '🦊', color: 'bg-brand-purple' };
const defaultPlayer2: Player = { name: '', avatar: '🐸', color: 'bg-brand-coral' };

const GameSessionContext = createContext<GameSessionContextType | undefined>(undefined);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [gameMode, setGameMode] = useState<GameMode>('TWO_PLAYERS');
  const [player1, setPlayer1] = useState<Player>(defaultPlayer1);
  const [player2, setPlayer2] = useState<Player>(defaultPlayer2);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const setPlayer1Name = (name: string) => setPlayer1((prev) => ({ ...prev, name }));
  const setPlayer1Avatar = (avatar: string) => setPlayer1((prev) => ({ ...prev, avatar }));
  
  const setPlayer2Name = (name: string) => setPlayer2((prev) => ({ ...prev, name }));
  const setPlayer2Avatar = (avatar: string) => setPlayer2((prev) => ({ ...prev, avatar }));

  const isSessionReady = () => {
    if (gameMode === 'SINGLE_PLAYER') {
      return player1.name.trim() !== '';
    }
    return player1.name.trim() !== '' && player2.name.trim() !== '';
  };

  const resetSession = () => {
    setPlayer1(defaultPlayer1);
    setPlayer2(defaultPlayer2);
    setSelectedGameId(null);
  };

  return (
    <GameSessionContext.Provider
      value={{
        gameMode,
        setGameMode,
        player1,
        player2,
        selectedGameId,
        setPlayer1Name,
        setPlayer1Avatar,
        setPlayer2Name,
        setPlayer2Avatar,
        setSelectedGameId,
        isSessionReady,
        resetSession,
      }}
    >
      {children}
    </GameSessionContext.Provider>
  );
}

export function useGameSession() {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return context;
}
