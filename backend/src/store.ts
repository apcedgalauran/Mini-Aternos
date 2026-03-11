import { ServerState, ServerStatus, Session, BackupInfo, PanelConfig } from './types';
import { config } from './config';
import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory state store for the server panel.
 * In production, replace with SQLite/Supabase for persistence.
 */
class StateStore {
  private status: ServerStatus = {
    state: 'offline',
    dropletId: null,
    dropletIp: null,
    sessionStart: null,
    playerCount: 0,
    maxPlayers: 20,
    selectedPlan: config.defaultSize,
  };

  private sessions: Session[] = [];

  private backupInfo: BackupInfo = {
    lastBackupTime: null,
    lastBackupSize: null,
  };

  private panelConfig: PanelConfig = {
    defaultPlan: config.defaultSize,
    domain: config.doDomain,
    subdomain: config.mcSubdomain,
    maxSessionHours: config.maxSessionHours,
    region: config.defaultRegion,
  };

  // --- Status ---

  getStatus(): ServerStatus {
    return { ...this.status };
  }

  setState(state: ServerState) {
    this.status.state = state;
  }

  setDroplet(id: number | null, ip: string | null) {
    this.status.dropletId = id;
    this.status.dropletIp = ip;
  }

  setSessionStart(time: string | null) {
    this.status.sessionStart = time;
  }

  setPlayerCount(count: number) {
    this.status.playerCount = count;
  }

  setSelectedPlan(plan: string) {
    this.status.selectedPlan = plan;
  }

  // --- Sessions ---

  getSessions(): Session[] {
    return [...this.sessions].reverse(); // newest first
  }

  startSession(plan: string): string {
    const id = uuidv4();
    this.sessions.push({
      id,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      costEstimate: null,
      plan,
      backupStatus: 'pending',
      backupSize: null,
    });
    return id;
  }

  endSession(id: string, backupStatus: 'success' | 'failed', backupSize: number | null, priceHourly: number) {
    const session = this.sessions.find((s) => s.id === id);
    if (!session) return;

    const endTime = new Date();
    session.endTime = endTime.toISOString();
    const startMs = new Date(session.startTime).getTime();
    const durationMin = Math.round((endTime.getTime() - startMs) / 60000);
    session.duration = durationMin;
    session.costEstimate = Math.round((durationMin / 60) * priceHourly * 10000) / 10000;
    session.backupStatus = backupStatus;
    session.backupSize = backupSize;
  }

  getCurrentSessionId(): string | null {
    const active = this.sessions.find((s) => s.endTime === null);
    return active?.id ?? null;
  }

  // --- Backup Info ---

  getBackupInfo(): BackupInfo {
    return { ...this.backupInfo };
  }

  setBackupInfo(time: string, size: number) {
    this.backupInfo.lastBackupTime = time;
    this.backupInfo.lastBackupSize = size;
  }

  // --- Config ---

  getConfig(): PanelConfig {
    return { ...this.panelConfig };
  }

  updateConfig(updates: Partial<PanelConfig>) {
    Object.assign(this.panelConfig, updates);
  }
}

export const store = new StateStore();
