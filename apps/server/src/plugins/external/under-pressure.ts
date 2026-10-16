import type { FastifyInstance } from "fastify";
import fastifyUnderPressure from "@fastify/under-pressure";
import fp from "fastify-plugin";

export const autoConfig = (fastify: FastifyInstance) => ({
  maxEventLoopDelay: 1000,
  maxHeapUsedBytes: 300_000_000,
  maxRssBytes: 1_000_000_000,
  maxEventLoopUtilization: 0.98,
  message: "服务繁忙，请稍后重试",
  retryAfter: 50,
  exposeStatusRoute: "/health",
  healthCheck: async () => {
    await fastify.db.get("SELECT 1");
    return true;
  },
  healthCheckInterval: 5000,
});

/**
 * This plugin measures process load, answers "Service Unavailable" when overloaded
 * and exposes the health check route.
 *
 * @see {@link https://github.com/fastify/under-pressure}
 */
export default fp(fastifyUnderPressure, {
  dependencies: ["mysql"],
});
