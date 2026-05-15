import { Router } from 'express';
import { getDb } from '../db.js';
import { generateSchedule } from '../schedule.js';

const router = Router();

router.get('/', (_req, res) => {
  const db = getDb();
  const doctors = db.prepare('SELECT id, name, title, level, emoji, description, fee FROM doctors').all();
  res.json(doctors);
});

router.get('/schedule', (_req, res) => {
  const db = getDb();
  const doctors = db.prepare('SELECT id, name, title, level, emoji, fee FROM doctors').all();
  const { days, map } = generateSchedule();

  const doctorMap = {};
  for (const d of doctors) {
    doctorMap[d.id] = d;
  }

  const schedule = days.map(day => {
    const d = new Date(day + 'T00:00:00');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      date: day,
      weekday: weekdays[d.getDay()],
      am: (map[`${day}-am`] || []).map(id => doctorMap[id]).filter(Boolean),
      pm: (map[`${day}-pm`] || []).map(id => doctorMap[id]).filter(Boolean),
    };
  });

  res.json(schedule);
});

export default router;
