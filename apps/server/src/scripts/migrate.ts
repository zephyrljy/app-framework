import { migrate } from "../migrate.js";

const migrations = await migrate({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
});

console.log(migrations.length === 0 ? "Database is up to date" : `Applied migrations: ${migrations.map(item => item.filename.split("/").at(-1)).join(", ")}`);
