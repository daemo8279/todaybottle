import postgres from "postgres";

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let sql;

export function db() {
  if (!connectionString) return null;
  if (!sql) {
    sql = postgres(connectionString, {
      ssl: "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }
  return sql;
}

export function requireAdmin(req, res) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    res.status(503).json({ error: "ADMIN_KEY is not configured" });
    return false;
  }
  const provided = req.headers["x-admin-key"];
  if (provided !== expected) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}
