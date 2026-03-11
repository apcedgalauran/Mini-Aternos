export type ServerState =
  | 'offline'
  | 'creating'
  | 'starting'
  | 'online'
  | 'stopping'
  | 'saving'
  | 'destroying';

export interface ServerStatus {
  state: ServerState;
  dropletId: number | null;
  dropletIp: string | null;
  sessionStart: string | null;
  playerCount: number;
  maxPlayers: number;
  selectedPlan: string;
}

export interface Session {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null; // minutes
  costEstimate: number | null;
  plan: string;
  backupStatus: 'pending' | 'success' | 'failed';
  backupSize: number | null; // bytes
}

export interface VpsPlan {
  slug: string;
  label: string;
  vcpus: number;
  memory: number; // MB
  disk: number; // GB
  transfer: number; // TB
  priceHourly: number;
  priceMonthly: number;
}

export interface PanelConfig {
  defaultPlan: string;
  domain: string;
  subdomain: string;
  maxSessionHours: number;
  region: string;
}

export interface BackupInfo {
  lastBackupTime: string | null;
  lastBackupSize: number | null;
}
