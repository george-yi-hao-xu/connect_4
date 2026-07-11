import { GAME_REGISTRY, type GameKey } from './registry';

const last_game_key = 'cs17:last_game';
const default_game_key: GameKey = 'connect4';

function is_game_key(value: string | null): value is GameKey {
  return value !== null && GAME_REGISTRY.some((entry) => entry.key === value);
}

export function get_saved_game_key(): GameKey {
  if (typeof window === 'undefined') return default_game_key;

  const saved_game_key = window.localStorage.getItem(last_game_key);
  return is_game_key(saved_game_key) ? saved_game_key : default_game_key;
}

export function save_game_key(game_key: GameKey): void {
  window.localStorage.setItem(last_game_key, game_key);
}
