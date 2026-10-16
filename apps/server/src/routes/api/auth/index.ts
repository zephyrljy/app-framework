import { createHash, timingSafeEqual } from "node:crypto";
import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { LoginSchema, TokenSchema } from "@app/contracts";

const digest = (value: string) => createHash("sha256").update(value).digest();

const plugin: FastifyPluginAsyncTypebox = async fastify => {
  fastify.post("/login", {
    schema: {
      body: LoginSchema,
      response: { 200: TokenSchema },
      tags: ["认证"],
      security: [],
    },
    config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
  }, async function (request, reply) {
    if (!timingSafeEqual(digest(request.body.password), digest(fastify.config.APP_PASSWORD))) {
      return reply.unauthorized("密码错误");
    }
    return { token: fastify.jwt.sign({}) };
  });
};

export default plugin;
