import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadEnv } from './config/loadEnv.js';

import goalRouter from './routes/goal.js';
import diagnosticRouter from './routes/diagnostic.js';
import sessionRouter from './routes/session.js';
import reportRouter from './routes/report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, 'data');

loadEnv(join(__dirname, '..'));

if (!existsSync(dataPath)) {
  mkdirSync(dataPath, { recursive: true });
}

// Load knowledge bank at startup — exit with code 1 if any file fails
const knowledgePath = join(__dirname, 'knowledge');
const knowledgeFiles = ['domains.json', 'questions.json', 'challenges.json'];

for (const file of knowledgeFiles) {
  try {
    readFileSync(join(knowledgePath, file), 'utf-8');
  } catch (err) {
    console.error(`[startup] Failed to load knowledge bank file: ${file}`, err.message);
    process.exit(1);
  }
}

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/goal', goalRouter);
app.use('/api/diagnostic', diagnosticRouter);
app.use('/api/session', sessionRouter);
app.use('/api/report', reportRouter);

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({
    success: false,
    data: null,
    error: err.message || 'Internal server error',
  });
});

const server = app.listen(PORT, () => {
  console.log(`SkillForge AI server running on http://localhost:${PORT}`);
});

export default app;
export { server };
