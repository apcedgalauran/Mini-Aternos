const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mini-aternos-token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('mini-aternos-token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mini-aternos-token');
    }
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const data = await this.request<{ token: string; expiresIn: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  // Server
  async getStatus() {
    return this.request<{
      state: string;
      dropletId: number | null;
      dropletIp: string | null;
      sessionStart: string | null;
      playerCount: number;
      maxPlayers: number;
      selectedPlan: string;
      backup: { lastBackupTime: string | null; lastBackupSize: number | null };
    }>('/server/status');
  }

  async startServer(plan?: string) {
    return this.request<{ message: string; plan: string }>('/server/start', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async stopServer() {
    return this.request<{ message: string }>('/server/stop', {
      method: 'POST',
    });
  }

  async backupServer() {
    return this.request<{ message: string }>('/server/backup', {
      method: 'POST',
    });
  }

  // Sessions
  async getSessions() {
    return this.request<Array<{
      id: string;
      startTime: string;
      endTime: string | null;
      duration: number | null;
      costEstimate: number | null;
      plan: string;
      backupStatus: string;
      backupSize: number | null;
    }>>('/sessions');
  }

  // Players
  async getPlayers() {
    return this.request<{
      online: boolean;
      playerCount: number;
      maxPlayers: number;
      players: string[];
    }>('/players');
  }

  // Plans
  async getPlans() {
    return this.request<Array<{
      slug: string;
      label: string;
      vcpus: number;
      memory: number;
      disk: number;
      transfer: number;
      priceHourly: number;
      priceMonthly: number;
    }>>('/plans');
  }

  // Config
  async getConfig() {
    return this.request<{
      defaultPlan: string;
      domain: string;
      subdomain: string;
      maxSessionHours: number;
      region: string;
    }>('/config');
  }

  async updateConfig(config: Record<string, unknown>) {
    return this.request('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }
}

export const api = new ApiClient();
