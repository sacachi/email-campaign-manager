import { sequelize } from './models';
import { startWorker, stopWorker } from './jobs/worker';
import { closePublisher } from './events/redis-publisher';

async function start() {
  await sequelize.authenticate();
  console.log('[worker-entry] Database connection established.');

  startWorker();

  const shutdown = async () => {
    await stopWorker();
    await closePublisher();
    await sequelize.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('[worker-entry] Failed to start worker:', err);
  process.exit(1);
});
