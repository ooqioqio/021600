import { getDb } from './db.js';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWeekSeed() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now - yearStart) / (7 * 24 * 60 * 60 * 1000));
  return now.getFullYear() * 100 + weekNum;
}

export function generateSchedule() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(tomorrow);
    d.setDate(tomorrow.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${dd}`);
  }

  const allSlots = [];
  for (const day of days) {
    allSlots.push(`${day}-am`);
    allSlots.push(`${day}-pm`);
  }

  const db = getDb();
  const doctors = db.prepare('SELECT id FROM doctors').all();

  const rng = seededRandom(getWeekSeed());
  const map = {};
  for (const day of days) {
    map[`${day}-am`] = [];
    map[`${day}-pm`] = [];
  }

  for (const doc of doctors) {
    const shuffled = shuffle(allSlots, rng);
    const picked = shuffled.slice(0, 3);
    for (const slot of picked) {
      if (map[slot]) {
        map[slot].push(doc.id);
      }
    }
  }

  return { days, map };
}
