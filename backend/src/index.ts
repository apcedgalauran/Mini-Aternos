import express from 'express';
import cors from 'cors';
import { config } from './config';
import { router } from './routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/v1', router);

// Start server
app.listen(config.port, () => {
  console.log(`Mini-Aternos Backend running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
