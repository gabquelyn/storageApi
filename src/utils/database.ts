import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();
const sequelize = new Sequelize(
  process.env.DATABASE_NAME!,
  process.env.DATABASE_USERNAME!,
  process.env.DATABASE_PASSWORD!,
  {
    dialect: process.env.DATABASE_DIALECT! as
      | "mysql"
      | "db2"
      | "sqlite"
      | "mariadb"
      | "mssql"
      | "oracle"
      | "postgres"
      | "snowflake"
      | "sqlite",
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME!,
    port: Number(process.env.DATABASE_PORT)
  }
);

export default sequelize;
