async function runStatement(db: D1Database, sql: string) {
  try {
    await db.prepare(sql).run();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (
      message.includes("duplicate column name") ||
      message.includes("already exists")
    ) {
      return;
    }

    throw error;
  }
}

export async function ensureEasyPosTables(db: D1Database) {
  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS merchants (id INTEGER PRIMARY KEY AUTOINCREMENT, merchant_owner_id INTEGER NOT NULL, name TEXT NOT NULL DEFAULT '', registration_number TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '', footer_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (merchant_owner_id) REFERENCES users(id) ON DELETE CASCADE)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_merchants_owner_id ON merchants(merchant_owner_id)",
  );

  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS user_to_merchant (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, merchant_id INTEGER NOT NULL, role TEXT NOT NULL DEFAULT 'member', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, merchant_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_user_to_merchant_user_id ON user_to_merchant(user_id)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_user_to_merchant_merchant_id ON user_to_merchant(merchant_id)",
  );

  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS easypos_state (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, products_json TEXT NOT NULL DEFAULT '[]', sales_json TEXT NOT NULL DEFAULT '[]', inventory_events_json TEXT NOT NULL DEFAULT '[]', merchant_json TEXT NOT NULL DEFAULT '{}', settings_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)",
  );
  await runStatement(db, "ALTER TABLE easypos_state ADD COLUMN merchant_id INTEGER");
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_state_user_id ON easypos_state(user_id)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_state_merchant_id ON easypos_state(merchant_id)",
  );

  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS easypos_products (row_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, merchant_id INTEGER, product_id TEXT NOT NULL, name TEXT NOT NULL, price REAL NOT NULL, stock INTEGER NOT NULL, unit_cost REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE)",
  );
  await runStatement(db, "ALTER TABLE easypos_products ADD COLUMN merchant_id INTEGER");
  await runStatement(db, "ALTER TABLE easypos_products ADD COLUMN creator_id INTEGER");
  await runStatement(db, "ALTER TABLE easypos_products ADD COLUMN image_id TEXT");
  await runStatement(db, "ALTER TABLE easypos_products ADD COLUMN image_url TEXT");
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_products_user_id ON easypos_products(user_id)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_products_merchant_id ON easypos_products(merchant_id)",
  );

  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS easypos_sales (row_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, merchant_id INTEGER, sale_id TEXT NOT NULL, created_at TEXT NOT NULL, total REAL NOT NULL, item_count INTEGER NOT NULL, UNIQUE(user_id, sale_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE)",
  );
  await runStatement(db, "ALTER TABLE easypos_sales ADD COLUMN merchant_id INTEGER");
  await runStatement(db, "ALTER TABLE easypos_sales ADD COLUMN public_token TEXT");
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_sales_user_id ON easypos_sales(user_id)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_sales_merchant_id ON easypos_sales(merchant_id)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_sales_public_token ON easypos_sales(public_token)",
  );

  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS easypos_sale_items (row_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, merchant_id INTEGER, sale_id TEXT NOT NULL, product_id TEXT NOT NULL, name TEXT NOT NULL, price REAL NOT NULL, quantity INTEGER NOT NULL, line_total REAL NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE)",
  );
  await runStatement(db, "ALTER TABLE easypos_sale_items ADD COLUMN merchant_id INTEGER");
  await runStatement(db, "ALTER TABLE easypos_sale_items ADD COLUMN image_url TEXT");
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_sale_items_user_sale ON easypos_sale_items(user_id, sale_id)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_sale_items_merchant_sale ON easypos_sale_items(merchant_id, sale_id)",
  );

  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS easypos_inventory_events (row_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, merchant_id INTEGER, event_id TEXT NOT NULL, type TEXT NOT NULL, created_at TEXT NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price REAL, unit_cost REAL, total_value REAL, total_cost REAL, reference_id TEXT, UNIQUE(user_id, event_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE)",
  );
  await runStatement(db, "ALTER TABLE easypos_inventory_events ADD COLUMN merchant_id INTEGER");
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_inventory_events_user_id ON easypos_inventory_events(user_id)",
  );
  await runStatement(
    db,
    "CREATE INDEX IF NOT EXISTS idx_easypos_inventory_events_merchant_id ON easypos_inventory_events(merchant_id)",
  );

  await runStatement(
    db,
    "CREATE TABLE IF NOT EXISTS easypos_settings (merchant_id INTEGER PRIMARY KEY, dark_mode INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE)",
  );
  await runStatement(db, "ALTER TABLE easypos_settings ADD COLUMN merchant_id INTEGER");
}
