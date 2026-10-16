import { randomUUID } from "node:crypto";
import { beforeEach, afterEach } from "node:test";
import Fastify from "fastify";
import fp from "fastify-plugin";
import { createConnection, type Connection } from "mysql2/promise";
import serviceApp, { options } from "../src/app.js";
import { migrate } from "../src/migrate.js";

process.env.APP_PASSWORD = "test-password";
process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";

function connectionOptions() {
  return {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
  };
}

export function buildApp() {
  const app = Fastify(options);
  app.register(fp(serviceApp));
  return app;
}

export function setupTestDatabase() {
  let connection: Connection;
  let name: string;
  beforeEach(async () => {
    if (process.env.MYSQL_USER !== "app_test") throw new Error("Tests require the isolated app_test user");
    connection = await createConnection({ ...connectionOptions(), database: undefined });
    name = `app_test_${randomUUID().replaceAll("-", "")}`;
    await connection.query(`CREATE DATABASE \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
    process.env.MYSQL_DATABASE = name;
    await migrate(connectionOptions());
  });
  afterEach(async () => {
    await connection.query(`DROP DATABASE \`${name}\``);
    await connection.end();
    delete process.env.MYSQL_DATABASE;
  });
}
