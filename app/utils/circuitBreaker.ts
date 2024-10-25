import { redis } from "./redis.server";

const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT = 60000; // 1 minute

export async function circuitBreaker<T>(
  key: string,
  operation: () => Promise<T>,
): Promise<T> {
  const failureCount = await redis.get(`circuit:${key}:failures`);

  if (failureCount && parseInt(failureCount) >= FAILURE_THRESHOLD) {
    const lastFailure = await redis.get(`circuit:${key}:lastFailure`);
    if (lastFailure && Date.now() - parseInt(lastFailure) < RESET_TIMEOUT) {
      throw new Error("Circuit is open");
    }
  }

  try {
    const result = await operation();
    await redis.del(`circuit:${key}:failures`);
    await redis.del(`circuit:${key}:lastFailure`);
    return result;
  } catch (error) {
    await redis.incr(`circuit:${key}:failures`);
    await redis.set(`circuit:${key}:lastFailure`, Date.now().toString());
    throw error;
  }
}
