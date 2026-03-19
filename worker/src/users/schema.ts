async function runStatement(db: D1Database, sql: string) {
  try {
    await db.prepare(sql).run();
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : "";

    if (
      message.includes("duplicate column name") ||
      message.includes("already exists")
    ) {
      return;
    }

    throw error;
  }
}

export async function ensureUsersTable(db: D1Database) {
  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  );
  await runStatement(db, "ALTER TABLE users ADD COLUMN display_name TEXT");
  await runStatement(db, "ALTER TABLE users ADD COLUMN email TEXT");
  await runStatement(db, "ALTER TABLE users ADD COLUMN phone TEXT");
  await runStatement(db, "ALTER TABLE users ADD COLUMN avatar_image_id TEXT");
  await runStatement(db, "ALTER TABLE users ADD COLUMN avatar_image_url TEXT");
  await runStatement(db, "ALTER TABLE users ADD COLUMN token_balance INTEGER");
  await runStatement(db, "ALTER TABLE users ADD COLUMN token_refreshed_month TEXT");
  await runStatement(db, "ALTER TABLE users ADD COLUMN token_refreshed_at TEXT");
  await runStatement(db, "ALTER TABLE users ADD COLUMN default_max_token INTEGER");
  await runStatement(db, "ALTER TABLE users ADD COLUMN max_product INTEGER");
  await runStatement(db, "ALTER TABLE users ADD COLUMN session_token TEXT");
  await runStatement(db, "ALTER TABLE users ADD COLUMN session_expires_at TEXT");
  await runStatement(
    db,
    "UPDATE users SET token_balance = 5000 WHERE token_balance IS NULL",
  );
  await runStatement(
    db,
    "UPDATE users SET default_max_token = 5000 WHERE default_max_token IS NULL",
  );
  await runStatement(
    db,
    "UPDATE users SET max_product = 100 WHERE max_product IS NULL",
  );
  await runStatement(
    db,
    "UPDATE users SET token_refreshed_at = CURRENT_TIMESTAMP WHERE token_refreshed_at IS NULL OR token_refreshed_at = ''",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token)",
  );
}
