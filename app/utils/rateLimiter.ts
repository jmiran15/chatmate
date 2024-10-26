import { RateLimiter } from "limiter-es6-compat";

// Groq rate limits
const REQUESTS_PER_MINUTE = 30;
const REQUESTS_PER_DAY = 7000;
const TOKENS_PER_MINUTE = 7000;
const TOKENS_PER_DAY = 500000;

// Create rate limiters
const requestsPerMinuteLimiter = new RateLimiter({
  tokensPerInterval: REQUESTS_PER_MINUTE,
  interval: "minute",
});

const requestsPerDayLimiter = new RateLimiter({
  tokensPerInterval: REQUESTS_PER_DAY,
  interval: "day",
});

const tokensPerMinuteLimiter = new RateLimiter({
  tokensPerInterval: TOKENS_PER_MINUTE,
  interval: "minute",
});

const tokensPerDayLimiter = new RateLimiter({
  tokensPerInterval: TOKENS_PER_DAY,
  interval: "day",
});

export async function checkRateLimits(
  estimatedTokens: number,
): Promise<boolean> {
  const [requestsPerMinute, requestsPerDay, tokensPerMinute, tokensPerDay] =
    await Promise.all([
      requestsPerMinuteLimiter.removeTokens(1),
      requestsPerDayLimiter.removeTokens(1),
      tokensPerMinuteLimiter.removeTokens(estimatedTokens),
      tokensPerDayLimiter.removeTokens(estimatedTokens),
    ]);

  return (
    requestsPerMinute >= 0 &&
    requestsPerDay >= 0 &&
    tokensPerMinute >= 0 &&
    tokensPerDay >= 0
  );
}

export async function correctTokenCount(
  actualTokens: number,
  estimatedTokens: number,
): Promise<void> {
  const difference = actualTokens - estimatedTokens;

  if (difference > 0) {
    // We underestimated, so remove additional tokens
    await Promise.all([
      tokensPerMinuteLimiter.removeTokens(difference),
      tokensPerDayLimiter.removeTokens(difference),
    ]);
  } else if (difference < 0) {
    // We overestimated, so add tokens back
    const tokensToAdd = Math.abs(difference);
    tokensPerMinuteLimiter.tokenBucket.content += tokensToAdd;
    tokensPerDayLimiter.tokenBucket.content += tokensToAdd;

    // Ensure we don't exceed the bucket size
    tokensPerMinuteLimiter.tokenBucket.content = Math.min(
      tokensPerMinuteLimiter.tokenBucket.content,
      tokensPerMinuteLimiter.tokenBucket.bucketSize,
    );
    tokensPerDayLimiter.tokenBucket.content = Math.min(
      tokensPerDayLimiter.tokenBucket.content,
      tokensPerDayLimiter.tokenBucket.bucketSize,
    );
  }
}
