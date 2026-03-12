import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL belum di-set. Client database akan gagal saat dipakai.");
}

const sql = postgres(connectionString ?? "postgres://localhost:5432/peersaku", {
  prepare: false,
});

export const db = drizzle(sql, { schema });
export { schema };
