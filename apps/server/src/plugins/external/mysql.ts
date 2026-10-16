import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import {
  createPool,
  type Pool,
  type PoolConnection,
  type PoolOptions,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

declare module "fastify" {
  export interface FastifyInstance {
    db: Database;
  }
}

type Value = string | number | Date | null;

export class Database {
  constructor(
    private pool: Pool,
    private connection: Pool | PoolConnection = pool,
  ) {}

  async all<T = Record<string, unknown>>(sql: string, ...values: Value[]) {
    const [rows] = await this.connection.query<RowDataPacket[]>(sql, values);
    return rows as T[];
  }

  async get<T = Record<string, unknown>>(
    sql: string,
    ...values: Value[]
  ): Promise<T | undefined> {
    return (await this.all<T>(sql, ...values))[0];
  }

  async run(sql: string, ...values: Value[]) {
    const [result] = await this.connection.query<ResultSetHeader>(sql, values);
    return result;
  }

  async transaction<T>(work: (db: Database) => Promise<T>) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(new Database(this.pool, connection));
      await connection.commit();
      return result;
    } catch (error) {
      console.error(error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

export function createDatabase(
  options: Pick<
    PoolOptions,
    "host" | "port" | "database" | "user" | "password"
  >,
) {
  return new Database(
    createPool({
      ...options,
      charset: "utf8mb4",
      connectionLimit: 5,
      decimalNumbers: true,
      timezone: "Z",
      typeCast: (field, next) => {
        if (field.type === "DATE") return field.string();
        if (field.type === "DATETIME") {
          const value = field.string();
          return value === null ? null : `${value.replace(" ", "T")}Z`;
        }
        return next();
      },
    }),
  );
}

export const autoConfig = (fastify: FastifyInstance) => ({
  host: fastify.config.MYSQL_HOST,
  port: fastify.config.MYSQL_PORT,
  database: fastify.config.MYSQL_DATABASE,
  user: fastify.config.MYSQL_USER,
  password: fastify.config.MYSQL_PASSWORD,
});

export default fp(
  async (fastify: FastifyInstance, opts: ReturnType<typeof autoConfig>) => {
    fastify.decorate("db", createDatabase(opts));

    fastify.addHook("onClose", async (instance) => {
      await instance.db.close();
    });
  },
  { name: "mysql" },
);
