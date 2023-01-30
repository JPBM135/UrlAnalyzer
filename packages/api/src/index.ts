import 'reflect-metadata';
import { createExpressApp } from './container/express.js';
import { createPostgres } from './container/postgres.js';
import { createRedis } from './container/redis.js';
import logger from './logger.js';

createExpressApp();
logger.success('Express app created');

createRedis();
logger.success('Redis client created');

createPostgres();
logger.success('Postgres client created');
