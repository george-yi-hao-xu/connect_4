import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.scss';
import App from './App';
import { GameProvider } from './context/GameContext';
import { connect4 } from './games/connect4';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GameProvider game={connect4}>
      <App />
    </GameProvider>
  </StrictMode>,
);
