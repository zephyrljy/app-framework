import path from "node:path";
import fastifyAutoload from "@fastify/autoload";
import type {
  FastifyError,
  FastifyHttpOptions,
  FastifyInstance,
  FastifyPluginOptions,
} from "fastify";
import type { Server } from "node:http";

export const options: FastifyHttpOptions<Server> = {
  // Apply recommended timeouts to prevent slow or idle clients from holding connections open
  connectionTimeout: 120_000,
  requestTimeout: 60_000,
  keepAliveTimeout: 10_000,
  http: {
    headersTimeout: 15_000,
  },
  ajv: {
    customOptions: {
      coerceTypes: "array", // change type of data to match type keyword
      removeAdditional: "all", // Remove additional body properties
    },
  },
};

export default async function serviceApp(
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  // This loads all external plugins defined in plugins/external
  // those should be registered first as your application plugins might depend on them
  await fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/external"),
    options: {},
  });

  // This loads all your application plugins defined in plugins/app
  // those should be support plugins that are reused
  // through your application
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "plugins/app"),
    options: { ...opts },
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  fastify.register(fastifyAutoload, {
    dir: path.join(import.meta.dirname, "routes"),
    autoHooks: true,
    cascadeHooks: true,
    options: { ...opts },
  });

  fastify.setErrorHandler((err: FastifyError, request, reply) => {
    fastify.log.error(
      {
        err,
        request: {
          method: request.method,
          url: request.url,
          query: request.query,
          params: request.params,
        },
      },
      "Unhandled error occurred",
    );

    reply.code(err.statusCode ?? 500);

    let message = "Internal Server Error";
    if (err.statusCode && err.statusCode < 500) {
      message = err.message;
    }

    return { message };
  });

  // An attacker could search for valid URLs if your 404 error handling is not rate limited.
  fastify.setNotFoundHandler(
    {
      preHandler: fastify.rateLimit({
        max: 3,
        timeWindow: 500,
      }),
    },
    (request, reply) => {
      // Browser routes of the web app are resolved by the client router
      if (request.method === "GET" && !request.url.startsWith("/api/")) {
        return reply.sendFile("index.html");
      }

      request.log.warn(
        {
          request: {
            method: request.method,
            url: request.url,
            query: request.query,
            params: request.params,
          },
        },
        "Resource not found",
      );

      reply.code(404);

      return { message: "Not Found" };
    },
  );
}
