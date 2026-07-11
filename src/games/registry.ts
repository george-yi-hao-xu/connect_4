import type { Game } from '../algo/types';
import type { ComponentType } from 'react';
import { connect4 } from './connect4';
import { gomoku } from './gomoku';
import { Connect4App } from '../components/connect4ui/Connect4App';
import { GomokuApp } from '../components/gomokuui/GomokuApp';

export interface GameEntry {
  key: string;
  label: string;
  game: Game<unknown, unknown>;
  component: ComponentType;
}

export const GAME_REGISTRY: GameEntry[] = [
  {
    key: 'connect4',
    label: 'Connect 4',
    game: connect4 as Game<unknown, unknown>,
    component: Connect4App,
  },
  {
    key: 'gomoku',
    label: 'Gomoku 五子棋',
    game: gomoku as Game<unknown, unknown>,
    component: GomokuApp,
  },
];

export type GameKey = (typeof GAME_REGISTRY)[number]['key'];
