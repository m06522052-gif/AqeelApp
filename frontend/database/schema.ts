import * as SQLite from 'expo-sqlite';

export const initDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('abdulsalam.db');

  // جدول المستخدمين
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // جدول المخازن
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      type TEXT NOT NULL,
      responsible TEXT,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // جدول الدفعات
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_number TEXT NOT NULL UNIQUE,
      supplier TEXT NOT NULL,
      receive_date TEXT NOT NULL,
      bag_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      responsible TEXT,
      warehouse_id INTEGER,
      notes TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
    );
  `);

  // جدول العمال
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      registration_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // جدول التوزيع
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distribution_number TEXT NOT NULL UNIQUE,
      worker_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      distribution_date TEXT NOT NULL,
      expected_completion_date TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers (id),
      FOREIGN KEY (batch_id) REFERENCES batches (id)
    );
  `);

  // جدول الإنتاج
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS production (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      distribution_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      production_date TEXT NOT NULL,
      quality TEXT NOT NULL,
      warehouse_id INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (distribution_id) REFERENCES distributions (id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
    );
  `);

  // جدول المدفوعات
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      distribution_id INTEGER,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES workers (id),
      FOREIGN KEY (distribution_id) REFERENCES distributions (id)
    );
  `);

  // جدول حركات المخزون
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movement_type TEXT NOT NULL,
      from_warehouse_id INTEGER,
      to_warehouse_id INTEGER,
      batch_id INTEGER,
      quantity INTEGER NOT NULL,
      responsible TEXT,
      notes TEXT,
      movement_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_warehouse_id) REFERENCES warehouses (id),
      FOREIGN KEY (to_warehouse_id) REFERENCES warehouses (id),
      FOREIGN KEY (batch_id) REFERENCES batches (id)
    );
  `);

  // إدراج مستخدم افتراضي للتجربة
  try {
    await db.runAsync(
      'INSERT OR IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      'admin', 'admin@abdulsalam.com', 'admin123', 'admin'
    );
  } catch (e) {
    console.log('Default user already exists');
  }

  return db;
};

export const getDatabase = async () => {
  return await SQLite.openDatabaseAsync('abdulsalam.db');
};
