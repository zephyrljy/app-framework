import path from "node:path";
import mysql, { type ConnectionOptions, type RowDataPacket } from "mysql2/promise";
import Postgrator from "postgrator";

const migrationDir = path.join(import.meta.dirname, "../migrations");

export async function migrate(options: Pick<ConnectionOptions, "host" | "port" | "database" | "user" | "password">) {
  const connection = await mysql.createConnection({ ...options, multipleStatements: true });
  try {
    const postgrator = new Postgrator({
      migrationPattern: path.join(migrationDir, "*.sql"),
      driver: "mysql",
      database: options.database,
      execQuery: async query => {
        const [rows, fields] = await connection.query(query);
        return { rows: rows as RowDataPacket[], fields };
      },
      schemaTable: "schemaversion",
    });

    return await postgrator.migrate();
  } finally {
    await connection.end();
  }
}
