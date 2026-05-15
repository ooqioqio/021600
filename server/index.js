import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb, closeDb } from './db.js';
import doctorsRouter from './routes/doctors.js';
import registrationRouter from './routes/registration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/doctors', doctorsRouter);
app.use('/api/registrations', registrationRouter);

app.use(express.static(join(__dirname, '..')));

getDb();
console.log('💾 SQLite 数据库已就绪');

const server = app.listen(PORT, () => {
  console.log(`🏥 阴阳怪气精神医院 · 后端服务已启动`);
  console.log(`   API 地址: http://localhost:${PORT}/api`);
  console.log(`   前端页面: http://localhost:${PORT}`);
  console.log(`   按 Ctrl+C 停止服务`);
});

function shutdown() {
  console.log('\n🛑 正在关闭服务...');
  server.close(() => {
    closeDb();
    console.log('✅ 数据库已关闭，资源已释放');
    process.exit(0);
  });
  setTimeout(() => {
    console.log('⚠ 强制退出');
    process.exit(1);
  }, 3000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
