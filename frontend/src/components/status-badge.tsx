'use client';

import { cn } from '@/lib/utils';

type ServerState = 'offline' | 'creating' | 'starting' | 'online' | 'stopping' | 'saving' | 'destroying';

const stateConfig: Record<ServerState, { label: string; color: string; pulse: boolean }> = {
  offline: { label: 'Offline', color: 'bg-slate-500', pulse: false },
  creating: { label: 'Creating', color: 'bg-amber-500', pulse: true },
  starting: { label: 'Starting', color: 'bg-amber-500', pulse: true },
  online: { label: 'Online', color: 'bg-emerald-500', pulse: true },
  stopping: { label: 'Stopping', color: 'bg-amber-500', pulse: true },
  saving: { label: 'Saving', color: 'bg-blue-500', pulse: true },
  destroying: { label: 'Destroying', color: 'bg-red-500', pulse: true },
};

export function StatusBadge({ state }: { state: string }) {
  const config = stateConfig[state as ServerState] || stateConfig.offline;

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        {config.pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              config.color
            )}
          />
        )}
        <span
          className={cn('relative inline-flex h-3 w-3 rounded-full', config.color)}
        />
      </span>
      <span className="text-sm font-medium text-slate-200">{config.label}</span>
    </div>
  );
}
