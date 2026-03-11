import { NodeSSH } from 'node-ssh';

class SSHService {
  /**
   * Execute a command on the remote Droplet via SSH
   */
  async executeCommand(
    host: string,
    command: string,
    privateKeyPath?: string
  ): Promise<{ stdout: string; stderr: string }> {
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host,
        username: 'root',
        privateKey: privateKeyPath || process.env.SSH_PRIVATE_KEY,
        readyTimeout: 30000,
      });

      const result = await ssh.execCommand(command, { cwd: '/' });
      return {
        stdout: result.stdout,
        stderr: result.stderr,
      };
    } finally {
      ssh.dispose();
    }
  }

  /**
   * Stop the Minecraft server gracefully
   */
  async stopMinecraftServer(host: string): Promise<void> {
    // Send save-all then stop via screen/systemctl
    await this.executeCommand(host, 'systemctl stop minecraft || true');
  }

  /**
   * Compress the world directory for upload
   */
  async compressWorld(host: string): Promise<void> {
    await this.executeCommand(
      host,
      'cd /opt/minecraft && zip -r /tmp/world-backup.zip world/'
    );
  }

  /**
   * Download the compressed world file contents from the server
   */
  async getWorldBackup(host: string): Promise<Buffer> {
    const ssh = new NodeSSH();

    try {
      await ssh.connect({
        host,
        username: 'root',
        privateKey: process.env.SSH_PRIVATE_KEY,
        readyTimeout: 30000,
      });

      const data = await ssh.getFile('/tmp/world-backup.zip', '/tmp/world-backup-local.zip');
      // Read from local temp
      const fs = await import('fs');
      const buffer = fs.readFileSync('/tmp/world-backup-local.zip');
      // Cleanup
      try { fs.unlinkSync('/tmp/world-backup-local.zip'); } catch { /* ignore */ }
      return buffer;
    } finally {
      ssh.dispose();
    }
  }

  /**
   * Check if Minecraft server is running
   */
  async isMinecraftRunning(host: string): Promise<boolean> {
    try {
      const result = await this.executeCommand(
        host,
        'systemctl is-active minecraft'
      );
      return result.stdout.trim() === 'active';
    } catch {
      return false;
    }
  }
}

export const sshService = new SSHService();
