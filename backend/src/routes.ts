import { Router, Request, Response } from 'express';
import { store } from './store';
import { digitalOceanService } from './services/digitalocean';
import { spacesService } from './services/spaces';
import { sshService } from './services/ssh';
import { queryMinecraftServer } from './services/minecraft-query';
import { generateCloudInit } from './cloud-init';
import { VPS_PLANS } from './plans';
import { authMiddleware, AuthRequest, login } from './auth';

const router = Router();

// --- Auth ---
router.post('/auth/login', login);

// Apply auth to all /v1/* routes below
router.use(authMiddleware);

// --- Server Status ---
router.get('/server/status', async (_req: Request, res: Response) => {
  const status = store.getStatus();
  const backup = store.getBackupInfo();

  // If online, poll player count
  if (status.state === 'online' && status.dropletIp) {
    try {
      const mc = await queryMinecraftServer(status.dropletIp);
      store.setPlayerCount(mc.playerCount);
      status.playerCount = mc.playerCount;
      status.maxPlayers = mc.maxPlayers;
    } catch {
      // Server might still be starting
    }
  }

  res.json({ ...status, backup });
});

// --- Start Server ---
router.post('/server/start', async (req: Request, res: Response) => {
  const currentStatus = store.getStatus();

  if (currentStatus.state !== 'offline') {
    res.status(400).json({ error: `Cannot start: server is ${currentStatus.state}` });
    return;
  }

  const { plan } = req.body;
  const selectedPlan = plan || store.getConfig().defaultPlan;

  // Validate plan
  const validPlan = VPS_PLANS.find((p) => p.slug === selectedPlan);
  if (!validPlan) {
    res.status(400).json({ error: `Invalid plan: ${selectedPlan}` });
    return;
  }

  store.setSelectedPlan(selectedPlan);
  store.setState('creating');

  // Return immediately, process async
  res.json({ message: 'Server creation started', plan: selectedPlan });

  try {
    // Create Droplet
    const userData = generateCloudInit();
    const droplet = await digitalOceanService.createDroplet(selectedPlan, userData);
    store.setDroplet(droplet.id, null);
    store.setState('starting');

    // Wait for Droplet to be ready
    const ip = await digitalOceanService.waitForDropletReady(droplet.id);
    store.setDroplet(droplet.id, ip);

    // Update DNS
    try {
      await digitalOceanService.updateDnsRecord(ip);
    } catch (dnsErr) {
      console.error('DNS update failed:', dnsErr);
    }

    // Start session tracking
    const sessionId = store.startSession(selectedPlan);
    store.setSessionStart(new Date().toISOString());

    // Wait for Minecraft to start (poll for ~3 minutes)
    let mcReady = false;
    for (let i = 0; i < 36; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      try {
        const mc = await queryMinecraftServer(ip);
        if (mc.online) {
          mcReady = true;
          break;
        }
      } catch {
        // Not ready yet
      }
    }

    store.setState('online');
    if (!mcReady) {
      console.warn('Minecraft server may not be fully ready yet');
    }
  } catch (err) {
    console.error('Failed to start server:', err);
    store.setState('offline');
    store.setDroplet(null, null);
  }
});

// --- Stop Server ---
router.post('/server/stop', async (_req: Request, res: Response) => {
  const currentStatus = store.getStatus();

  if (currentStatus.state !== 'online' && currentStatus.state !== 'starting') {
    res.status(400).json({ error: `Cannot stop: server is ${currentStatus.state}` });
    return;
  }

  const dropletId = currentStatus.dropletId;
  const dropletIp = currentStatus.dropletIp;

  if (!dropletId) {
    res.status(400).json({ error: 'No active Droplet' });
    return;
  }

  store.setState('stopping');
  res.json({ message: 'Server shutdown initiated' });

  try {
    // Stop Minecraft gracefully
    if (dropletIp) {
      try {
        await sshService.stopMinecraftServer(dropletIp);
      } catch (err) {
        console.error('Failed to stop MC via SSH:', err);
      }
    }

    store.setState('saving');

    // Compress and upload world
    let backupStatus: 'success' | 'failed' = 'failed';
    let backupSize: number | null = null;

    if (dropletIp) {
      try {
        await sshService.compressWorld(dropletIp);
        const worldData = await sshService.getWorldBackup(dropletIp);

        // Upload latest + timestamped version
        const result = await spacesService.uploadWorldBackup(worldData);
        backupSize = result.size;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await spacesService.uploadWorldBackup(worldData, `world-backup-${timestamp}.zip`);

        store.setBackupInfo(new Date().toISOString(), backupSize);
        backupStatus = 'success';
      } catch (err) {
        console.error('World backup failed:', err);
      }
    }

    store.setState('destroying');

    // Destroy Droplet
    await digitalOceanService.destroyDroplet(dropletId);

    // End session
    const sessionId = store.getCurrentSessionId();
    if (sessionId) {
      const plan = VPS_PLANS.find((p) => p.slug === currentStatus.selectedPlan);
      store.endSession(sessionId, backupStatus, backupSize, plan?.priceHourly ?? 0);
    }

    store.setState('offline');
    store.setDroplet(null, null);
    store.setSessionStart(null);
    store.setPlayerCount(0);
  } catch (err) {
    console.error('Failed to stop server:', err);
    store.setState('offline');
    store.setDroplet(null, null);
    store.setSessionStart(null);
  }
});

// --- Manual Backup ---
router.post('/server/backup', async (_req: Request, res: Response) => {
  const currentStatus = store.getStatus();

  if (currentStatus.state !== 'online' || !currentStatus.dropletIp) {
    res.status(400).json({ error: 'Server must be online to backup' });
    return;
  }

  res.json({ message: 'Backup initiated' });

  try {
    await sshService.compressWorld(currentStatus.dropletIp);
    const worldData = await sshService.getWorldBackup(currentStatus.dropletIp);
    const result = await spacesService.uploadWorldBackup(worldData);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await spacesService.uploadWorldBackup(worldData, `world-backup-${timestamp}.zip`);

    store.setBackupInfo(new Date().toISOString(), result.size);
  } catch (err) {
    console.error('Manual backup failed:', err);
  }
});

// --- Sessions ---
router.get('/sessions', (_req: Request, res: Response) => {
  res.json(store.getSessions());
});

// --- Players ---
router.get('/players', async (_req: Request, res: Response) => {
  const status = store.getStatus();

  if (status.state !== 'online' || !status.dropletIp) {
    res.json({ online: false, playerCount: 0, maxPlayers: 0, players: [] });
    return;
  }

  try {
    const result = await queryMinecraftServer(status.dropletIp);
    store.setPlayerCount(result.playerCount);
    res.json(result);
  } catch {
    res.json({ online: false, playerCount: 0, maxPlayers: 0, players: [] });
  }
});

// --- Plans ---
router.get('/plans', (_req: Request, res: Response) => {
  res.json(VPS_PLANS);
});

// --- Config ---
router.get('/config', (_req: Request, res: Response) => {
  res.json(store.getConfig());
});

router.put('/config', (req: Request, res: Response) => {
  const { defaultPlan, domain, subdomain, maxSessionHours, region } = req.body;
  const updates: Record<string, unknown> = {};

  if (defaultPlan) {
    const valid = VPS_PLANS.find((p) => p.slug === defaultPlan);
    if (!valid) {
      res.status(400).json({ error: `Invalid plan: ${defaultPlan}` });
      return;
    }
    updates.defaultPlan = defaultPlan;
  }
  if (domain) updates.domain = domain;
  if (subdomain) updates.subdomain = subdomain;
  if (maxSessionHours) updates.maxSessionHours = maxSessionHours;
  if (region) updates.region = region;

  store.updateConfig(updates);
  res.json(store.getConfig());
});

export { router };
