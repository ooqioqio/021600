import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '..', 'fpc_data.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      title       TEXT NOT NULL,
      level       TEXT DEFAULT '一级专家' CHECK(level IN ('主任','一级专家')),
      emoji       TEXT DEFAULT '',
      description TEXT DEFAULT '',
      fee         INTEGER DEFAULT 3
    );

    CREATE TABLE IF NOT EXISTS patients (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      age         INTEGER,
      gender      TEXT,
      phone       TEXT,
      created_at  TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id           TEXT PRIMARY KEY,
      patient_id   INTEGER NOT NULL,
      doctor_id    TEXT NOT NULL,
      schedule_date TEXT NOT NULL,
      period       TEXT NOT NULL CHECK(period IN ('am', 'pm')),
      symptom      TEXT DEFAULT '',
      status       TEXT DEFAULT 'registered' CHECK(status IN ('registered','waiting','diagnosing','completed','cancelled')),
      created_at   TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id)  REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS diagnoses (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id TEXT NOT NULL,
      diagnosis       TEXT NOT NULL,
      severity        TEXT DEFAULT 'moderate' CHECK(severity IN ('mild','moderate','severe','hilarious','terminal_laughter')),
      notes           TEXT DEFAULT '',
      diagnosed_at    TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id TEXT NOT NULL,
      medication      TEXT NOT NULL,
      dosage          TEXT NOT NULL,
      frequency       TEXT NOT NULL,
      duration        TEXT NOT NULL,
      notes           TEXT DEFAULT '',
      prescribed_at   TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    );

    CREATE TABLE IF NOT EXISTS medication_logs (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id INTEGER NOT NULL,
      dispensed_at    TEXT DEFAULT (datetime('now', 'localtime')),
      dispensed_by    TEXT DEFAULT '机器人药房',
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
    );

    CREATE TABLE IF NOT EXISTS hospitalizations (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id  TEXT NOT NULL,
      room_number      TEXT NOT NULL,
      admitted_at      TEXT DEFAULT (datetime('now', 'localtime')),
      discharged_at    TEXT,
      ward_type        TEXT DEFAULT '普通病房' CHECK(ward_type IN ('普通病房','VIP套房','隔离室','欢乐 padded room')),
      notes            TEXT DEFAULT '',
      FOREIGN KEY (registration_id) REFERENCES registrations(id)
    );
  `);

  seedDoctors();
}

function seedDoctors() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM doctors').get();
  if (count.cnt > 0) return;

  const insert = db.prepare('INSERT INTO doctors (id, name, title, level, emoji, description, fee) VALUES (?, ?, ?, ?, ?, ?, ?)');

  const doctors = [
    ['dr1', '邓主任', 'CHIEF', '主任', '🧠', '院长兼首席精神病学家，擅长用眼神诊断病情。据说他自己也有点……那个。挂号时请保持冷静，虽然他可能比你还不冷静。', 5],
    ['dr2', '陈心凌', 'SENIOR', '一级专家', '🔮', '专攻梦境解析与潜意识挖掘。她看你的眼神总让你觉得自己没穿衣服。据说她的诊疗室从来不用开灯——她的目光够亮了。', 3],
    ['dr3', '赵无忌', 'SENIOR', '一级专家', '⚡', '激进电击疗法倡导者，口头禅是「再来一次，你会爱上它的」。持有「电疗艺术家」认证，诊疗室里挂满了他和康复（？）患者的合影。', 3],
    ['dr4', '刘梦游', 'SENIOR', '一级专家', '😴', '据说他能在梦游中做手术，醒着反而不会看病。请勿在他诊室大声喧哗——吵醒他后果自负。患者评价：「睡得比我这个失眠的还香」。', 3],
    ['dr5', '王电波', 'SENIOR', '一级专家', '📡', '坚信自己能接收外星精神病学广播，笔记全是不可名状的符号。诊疗时会佩戴自制「天线帽」，声称能截获来自仙女座星系的治疗方案。', 3],
  ];

  const tx = db.transaction(() => {
    for (const d of doctors) {
      insert.run(...d);
    }
  });
  tx();
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
