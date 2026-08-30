import mysql, {type Pool, type PoolConnection, type PoolOptions, type ResultSetHeader, type RowDataPacket} from "mysql2/promise";

const globalForDb = globalThis as unknown as {origemPool?: Pool};

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function databaseOptions(databaseUrl: string): PoolOptions {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL inválida. Use mysql://USUARIO:SENHA@HOST:3306/BANCO.");
  }

  if (url.protocol !== "mysql:" && url.protocol !== "mysql2:") {
    throw new Error("DATABASE_URL deve começar com mysql://.");
  }

  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!url.hostname || !url.username || !database) {
    throw new Error("DATABASE_URL incompleta. Informe host, usuário e banco.");
  }

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
    connectionLimit: 8,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    charset: "utf8mb4",
    timezone: "-03:00",
    dateStrings: true,
    decimalNumbers: true,
  };
}

export function getPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL não configurada.");

  if (!globalForDb.origemPool) {
    globalForDb.origemPool = mysql.createPool(databaseOptions(databaseUrl));
  }

  return globalForDb.origemPool;
}

export async function queryRows<T extends RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await getPool().execute<T[]>(sql, params);
  return rows;
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params);
  return result;
}

export async function withTransaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
