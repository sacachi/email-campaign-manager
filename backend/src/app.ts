import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import campaignRoutes from './routes/campaigns';
import recipientRoutes from './routes/recipients';
import statsRoutes from './routes/stats';
import trackingRoutes from './routes/tracking';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development'
    ? /^http:\/\/localhost(:\d+)?$/
    : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/campaigns', campaignRoutes);
app.use('/recipients', recipientRoutes);
app.use('/stats', statsRoutes);
app.use('/track', trackingRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

export default app;
