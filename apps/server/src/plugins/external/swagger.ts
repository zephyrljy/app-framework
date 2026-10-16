import fp from "fastify-plugin";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifySwagger from "@fastify/swagger";

export default fp(async function (fastify) {
  /**
   * A Fastify plugin for serving OpenAPI v3 schemas.
   *
   * @see {@link https://github.com/fastify/fastify-swagger}
   */
  await fastify.register(fastifySwagger, {
    hideUntagged: true,
    openapi: {
      info: {
        title: "App API",
        description: "应用接口",
        version: "0.1.0",
      },
      components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
      security: [{ bearerAuth: [] }],
    },
  });

  /**
   * A Fastify plugin for serving Swagger UI.
   *
   * @see {@link https://github.com/fastify/fastify-swagger-ui}
   */
  await fastify.register(fastifySwaggerUi, {
    routePrefix: "/api/docs",
  });
});
