import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

router.post('/', (req, res) => {
  const db = getDb();
  const { name, age, gender, phone, doctorId, scheduleDate, period, symptom } = req.body;

  if (!name || !doctorId || !scheduleDate || !period) {
    return res.status(400).json({ error: '缺少必填字段：name, doctorId, scheduleDate, period' });
  }

  if (!['am', 'pm'].includes(period)) {
    return res.status(400).json({ error: 'period 只能是 am 或 pm' });
  }

  const doctor = db.prepare('SELECT id FROM doctors WHERE id = ?').get(doctorId);
  if (!doctor) {
    return res.status(404).json({ error: '医生不存在' });
  }

  const regId = generateRegId();

  const insertPatient = db.prepare(
    'INSERT INTO patients (name, age, gender, phone) VALUES (?, ?, ?, ?)'
  );
  const patientResult = insertPatient.run(name, age || null, gender || null, phone || null);
  const patientId = patientResult.lastInsertRowid;

  const insertReg = db.prepare(
    `INSERT INTO registrations (id, patient_id, doctor_id, schedule_date, period, symptom, status)
     VALUES (?, ?, ?, ?, ?, ?, 'registered')`
  );
  insertReg.run(regId, patientId, doctorId, scheduleDate, period, symptom || '');

  const result = db.prepare(`
    SELECT r.*, p.name as patient_name, p.age, p.gender, p.phone,
           d.name as doctor_name, d.title as doctor_title, d.emoji as doctor_emoji
    FROM registrations r
    JOIN patients p ON r.patient_id = p.id
    JOIN doctors d ON r.doctor_id = d.id
    WHERE r.id = ?
  `).get(regId);

  res.status(201).json(result);
});

router.get('/', (_req, res) => {
  const db = getDb();
  const records = db.prepare(`
    SELECT r.*, p.name as patient_name, p.age, p.gender, p.phone,
           d.name as doctor_name, d.title as doctor_title, d.emoji as doctor_emoji
    FROM registrations r
    JOIN patients p ON r.patient_id = p.id
    JOIN doctors d ON r.doctor_id = d.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(records);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const record = db.prepare(`
    SELECT r.*, p.name as patient_name, p.age, p.gender, p.phone,
           d.name as doctor_name, d.title as doctor_title, d.emoji as doctor_emoji
    FROM registrations r
    JOIN patients p ON r.patient_id = p.id
    JOIN doctors d ON r.doctor_id = d.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!record) {
    return res.status(404).json({ error: '挂号记录不存在' });
  }
  res.json(record);
});

function generateRegId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `FPC-${y}${m}${d}-${rand}`;
}

export default router;
