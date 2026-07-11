import { useState } from 'react';
import { GAME_REGISTRY } from '../games/registry';
import './Sidebar.scss';

interface SidebarProps {
  game: string;
  onGameChange: (game: string) => void;
}

export function Sidebar({ game, onGameChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        ☰
      </button>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Games</h2>
          <button
            className="sidebar-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {GAME_REGISTRY.map(({ key, label }) => (
            <button
              key={key}
              className={`sidebar-item ${game === key ? 'active' : ''}`}
              onClick={() => {
                onGameChange(key);
                setIsOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
