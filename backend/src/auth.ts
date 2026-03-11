import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * JWT authentication middleware
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { sub: string };
    req.userId = decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Login handler — validates credentials and returns JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  if (username !== config.adminUsername) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // If password hash is configured, verify against it
  if (config.adminPasswordHash) {
    const valid = await bcrypt.compare(password, config.adminPasswordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
  }

  const token = jwt.sign(
    { sub: username, iat: Math.floor(Date.now() / 1000) },
    config.jwtSecret,
    { expiresIn: '24h' }
  );

  res.json({ token, expiresIn: 86400 });
}

/**
 * Generate a password hash (utility for setup)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
