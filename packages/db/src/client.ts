import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

export type DbClient = PostgresJsDatabase<typeof schema>;

export interface CreateDbOptions {
  url?: string;
  logger?: boolean;
  ssl?: boolean | "require" | object;
}

export function createDb(options: CreateDbOptions = {}): DbClient {
  return createConnection(options).db;
}

export async function withDb<T>(
  fn: (db: DbClient) => Promise<T>,
  options?: CreateDbOptions
): Promise<T> {
  const { db, client } = createConnection(options);
  try {
    return await fn(db);
  } finally {
    await client.end({ timeout: 5 });
  }
}

function createConnection(options: CreateDbOptions = {}) {
  const url = options.url ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not defined");
  }

  const client = postgres(url, {
    ssl: options.ssl ?? "require",
    prepare: false
  });

  const db = drizzle(client, { schema, logger: options.logger });

  return { client, db };
}
