import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // DigitalOcean API
  doApiToken: process.env.DO_API_TOKEN || '',
  doSshKeyId: process.env.DO_SSH_KEY_ID || '',

  // DigitalOcean Spaces
  doSpacesKey: process.env.DO_SPACES_KEY || '',
  doSpacesSecret: process.env.DO_SPACES_SECRET || '',
  doSpacesBucket: process.env.DO_SPACES_BUCKET || 'minecraft-worlds',
  doSpacesRegion: process.env.DO_SPACES_REGION || 'sgp1',

  // Domain
  doDomain: process.env.DO_DOMAIN || '',
  mcSubdomain: process.env.MC_SUBDOMAIN || 'mc',

  // Auth
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',

  // Server defaults
  defaultRegion: process.env.DEFAULT_REGION || 'sgp1',
  defaultSize: process.env.DEFAULT_SIZE || 's-1vcpu-2gb',
  maxSessionHours: parseInt(process.env.MAX_SESSION_HOURS || '8', 10),
};
