import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("sebotracker.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    food_score INTEGER DEFAULT 0,
    sleep_penalty INTEGER DEFAULT 0,
    stress_penalty INTEGER DEFAULT 0,
    medication_mitigation INTEGER DEFAULT 0,
    total_srs INTEGER DEFAULT 0,
    food_items TEXT,
    sleep_start TEXT,
    sleep_end TEXT,
    slept_after_1am INTEGER DEFAULT 0,
    travel_day INTEGER DEFAULT 0,
    shampoo_done INTEGER DEFAULT 0,
    cream_applied INTEGER DEFAULT 0,
    itch_level INTEGER DEFAULT 0,
    flakes INTEGER DEFAULT 0,
    redness INTEGER DEFAULT 0,
    calories INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Ensure all columns exist for existing databases
const columns = [
  { name: 'slept_after_1am', type: 'INTEGER DEFAULT 0' },
  { name: 'travel_day', type: 'INTEGER DEFAULT 0' },
  { name: 'shampoo_done', type: 'INTEGER DEFAULT 0' },
  { name: 'cream_applied', type: 'INTEGER DEFAULT 0' },
  { name: 'itch_level', type: 'INTEGER DEFAULT 0' },
  { name: 'flakes', type: 'INTEGER DEFAULT 0' },
  { name: 'redness', type: 'INTEGER DEFAULT 0' },
  { name: 'calories', type: 'INTEGER DEFAULT 0' }
];

columns.forEach(col => {
  try {
    db.exec(`ALTER TABLE daily_logs ADD COLUMN ${col.name} ${col.type}`);
    console.log(`Added column ${col.name} to daily_logs`);
  } catch (err: any) {
    if (err.message.includes('duplicate column name')) {
      // Column already exists, ignore
    } else {
      console.error(`Error adding column ${col.name}:`, err.message);
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  const PORT = 3000;

  // API Routes
  app.get("/api/logs", (req, res) => {
    const logs = db.prepare("SELECT * FROM daily_logs ORDER BY date DESC LIMIT 30").all();
    res.json(logs.map(log => ({
      ...log,
      slept_after_1am: !!log.slept_after_1am,
      travel_day: !!log.travel_day,
      shampoo_done: !!log.shampoo_done,
      cream_applied: !!log.cream_applied
    })));
  });

  app.post("/api/logs", (req, res) => {
    const { 
      date, 
      food_score, 
      sleep_penalty, 
      stress_penalty, 
      medication_mitigation, 
      total_srs, 
      food_items,
      sleep_start,
      sleep_end,
      slept_after_1am,
      travel_day,
      shampoo_done,
      cream_applied,
      itch_level,
      flakes,
      redness,
      calories
    } = req.body;
    
    try {
      const upsert = db.prepare(`
        INSERT INTO daily_logs (
          date, food_score, sleep_penalty, stress_penalty, medication_mitigation, total_srs, food_items, 
          sleep_start, sleep_end, slept_after_1am, travel_day, shampoo_done, cream_applied, 
          itch_level, flakes, redness, calories
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          food_score = excluded.food_score,
          sleep_penalty = excluded.sleep_penalty,
          stress_penalty = excluded.stress_penalty,
          medication_mitigation = excluded.medication_mitigation,
          total_srs = excluded.total_srs,
          food_items = excluded.food_items,
          sleep_start = excluded.sleep_start,
          sleep_end = excluded.sleep_end,
          slept_after_1am = excluded.slept_after_1am,
          travel_day = excluded.travel_day,
          shampoo_done = excluded.shampoo_done,
          cream_applied = excluded.cream_applied,
          itch_level = excluded.itch_level,
          flakes = excluded.flakes,
          redness = excluded.redness,
          calories = excluded.calories
      `);
      
      upsert.run(
        date, 
        food_score, 
        sleep_penalty, 
        stress_penalty, 
        medication_mitigation, 
        total_srs, 
        JSON.stringify(food_items),
        sleep_start || null,
        sleep_end || null,
        slept_after_1am ? 1 : 0,
        travel_day ? 1 : 0,
        shampoo_done ? 1 : 0,
        cream_applied ? 1 : 0,
        itch_level || 0,
        flakes || 0,
        redness || 0,
        calories || 0
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to save log" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SeboTracker Server running on http://localhost:${PORT}`);
  });
}

startServer();
