import { RateLimiterMemory } from 'rate-limiter-flexible'

export const rateLimiter = new RateLimiterMemory({
  points: 10, // Number of points
  duration: 1, // Per second
})

