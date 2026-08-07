import { DuckDBInstance } from '@duckdb/node-api';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/llm_spend');

const instance = await DuckDBInstance.create(':memory:');
export const db = await instance.connect();

await db.run(
  `CREATE VIEW usage_events AS
   SELECT * FROM read_csv_auto('${DATA}/usage_events.csv', header=true, nullstr='')`
);

await db.run(
  `CREATE VIEW customers AS
   SELECT * FROM read_csv_auto('${DATA}/dimensions/customers.csv', header=true, nullstr='')`
);

export async function runQuery(sql: string) {
  const reader = await db.runAndReadAll(sql);
  return reader.getRowObjectsJson();
}
