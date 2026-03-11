import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

const DO_API_BASE = 'https://api.digitalocean.com/v2';

class DigitalOceanService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: DO_API_BASE,
      headers: {
        Authorization: `Bearer ${config.doApiToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Create a new Droplet with cloud-init user-data
   */
  async createDroplet(size: string, userData: string): Promise<{ id: number; name: string }> {
    const name = `mc-server-${Date.now()}`;
    const response = await this.client.post('/droplets', {
      name,
      region: config.defaultRegion,
      size,
      image: 'ubuntu-22-04-x64',
      ssh_keys: [config.doSshKeyId],
      backups: false,
      monitoring: false,
      ipv6: true,
      user_data: userData,
      tags: ['minecraft', 'mini-aternos'],
    });

    return {
      id: response.data.droplet.id,
      name: response.data.droplet.name,
    };
  }

  /**
   * Get Droplet info including IP address
   */
  async getDroplet(dropletId: number): Promise<{
    id: number;
    status: string;
    ip: string | null;
  }> {
    const response = await this.client.get(`/droplets/${dropletId}`);
    const droplet = response.data.droplet;
    const ipv4 = droplet.networks?.v4?.find(
      (n: { type: string; ip_address: string }) => n.type === 'public'
    );

    return {
      id: droplet.id,
      status: droplet.status,
      ip: ipv4?.ip_address ?? null,
    };
  }

  /**
   * Destroy a Droplet
   */
  async destroyDroplet(dropletId: number): Promise<void> {
    await this.client.delete(`/droplets/${dropletId}`);
  }

  /**
   * Update DNS A-record for mc.yourdomain.com
   */
  async updateDnsRecord(ip: string): Promise<void> {
    const domain = config.doDomain;
    const subdomain = config.mcSubdomain;

    if (!domain) return;

    // List existing records to find the A record for the subdomain
    const records = await this.client.get(`/domains/${domain}/records`);
    const existing = records.data.domain_records.find(
      (r: { type: string; name: string }) => r.type === 'A' && r.name === subdomain
    );

    if (existing) {
      await this.client.put(`/domains/${domain}/records/${existing.id}`, {
        data: ip,
        ttl: 60,
      });
    } else {
      await this.client.post(`/domains/${domain}/records`, {
        type: 'A',
        name: subdomain,
        data: ip,
        ttl: 60,
      });
    }
  }

  /**
   * Wait for Droplet to become active and have an IP
   */
  async waitForDropletReady(dropletId: number, maxAttempts = 60): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const droplet = await this.getDroplet(dropletId);
      if (droplet.status === 'active' && droplet.ip) {
        return droplet.ip;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new Error('Droplet did not become ready in time');
  }
}

export const digitalOceanService = new DigitalOceanService();
