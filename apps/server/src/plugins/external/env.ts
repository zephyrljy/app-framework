import env from "@fastify/env";

declare module "fastify" {
  export interface FastifyInstance {
    config: {
      MYSQL_HOST: string;
      MYSQL_PORT: number;
      MYSQL_DATABASE: string;
      MYSQL_USER: string;
      MYSQL_PASSWORD: string;
      APP_PASSWORD: string;
      JWT_SECRET: string;
      RATE_LIMIT_MAX: number;
    };
  }
}

const schema = {
  type: "object",
  required: [
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_DATABASE",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "APP_PASSWORD",
    "JWT_SECRET",
  ],
  properties: {
    // Database
    MYSQL_HOST: { type: "string" },
    MYSQL_PORT: { type: "number" },
    MYSQL_DATABASE: { type: "string" },
    MYSQL_USER: { type: "string" },
    MYSQL_PASSWORD: { type: "string" },

    // Security
    APP_PASSWORD: { type: "string", minLength: 1 },
    JWT_SECRET: { type: "string", minLength: 32 },
    RATE_LIMIT_MAX: { type: "number", default: 100 },
  },
};

export const autoConfig = {
  confKey: "config",
  schema,
  data: process.env,
};

/**
 * This plugin checks environment variables.
 *
 * @see {@link https://github.com/fastify/fastify-env}
 */
export default env;
