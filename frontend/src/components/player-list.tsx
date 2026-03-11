'use client';

import { Users } from 'lucide-react';

interface PlayerListProps {
  players: string[];
  playerCount: number;
  maxPlayers: number;
  online: boolean;
}

export function PlayerList({ players, playerCount, maxPlayers, online }: PlayerListProps) {
  if (!online) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <Users className="h-8 w-8 mb-2" />
        <p className="text-sm">Server is offline</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">Players Online</span>
        <span className="text-sm font-semibold text-slate-200">
          {playerCount}/{maxPlayers}
        </span>
      </div>

      {/* Player count bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${maxPlayers > 0 ? (playerCount / maxPlayers) * 100 : 0}%` }}
        />
      </div>

      {/* Player list */}
      {players.length > 0 ? (
        <ul className="space-y-1.5">
          {players.map((player) => (
            <li
              key={player}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/50"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-300">{player}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-500 text-center py-2">
          {playerCount > 0 ? 'Player names unavailable' : 'No players connected'}
        </p>
      )}
    </div>
  );
}
