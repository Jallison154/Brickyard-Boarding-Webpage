import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import crypto from 'crypto';
import clientsRouter from './routes/clients.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || '';

app.use(helmet());
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

// Simple bearer token auth middleware
function auth(req, res, next) {
  if (!API_TOKEN) return res.status(500).json({ error: 'Server token not configured' });
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token || token !== API_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api', auth, clientsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Brickyard backend listening on :${PORT}`);
});


