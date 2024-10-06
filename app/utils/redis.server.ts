import type { RedisOptions, Redis as RedisType } from "ioredis";
import Redis from "ioredis";

let redis: RedisType;

declare global {
  // eslint-disable-next-line no-var
  var __redis: RedisType | undefined;
}

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the Redis with every change either.
if (process.env.NODE_ENV === "production") {
  redis = new Redis(process.env.REDIS_URL_PROD || "", redisOptions);
} else {
  if (!global.__redis) {
    global.__redis = new Redis(process.env.REDIS_URL_DEV || "", redisOptions);
  }
  redis = global.__redis;
}

export { redis };
