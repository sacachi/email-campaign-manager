import app from './app';
import config from './config';
import { sequelize } from './models';
import { verifyConnection } from './services/email.service';
import { startScheduler } from './jobs/scheduler';
import { startCampaignEventSubscriber, stopCampaignEventSubscriber } from './events/redis-subscriber';

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    await verifyConnection();

    // Subscribe to Redis events from the worker and forward to SSE clients
    startCampaignEventSubscriber();

    // Sync any existing scheduled campaigns into BullMQ on startup
    await startScheduler();

    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down...');
      await stopCampaignEventSubscriber();
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}

start();
