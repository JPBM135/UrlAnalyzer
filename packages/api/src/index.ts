import 'reflect-metadata';
import { createPromRegistry } from 'container/prometheus.js';
import { createRouter } from 'routes/index.js';
import { createExpressApp } from './container/express.js';
import { createPostgres } from './container/postgres.js';
import { createRedis } from './container/redis.js';
import logger from './logger.js';

createPromRegistry();
logger.success('Prometheus registry created');

createExpressApp();
logger.success('Express app created');

createRedis();
logger.success('Redis client created');

createPostgres();
logger.success('Postgres client created');

await createRouter();
logger.success('Routes created');
