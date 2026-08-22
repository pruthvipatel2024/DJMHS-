const app = require('./app');
const config = require('./config');
const prisma = require('./config/db');
const examRoutes = require('./routes/exam.routes');
const feeRoutes = require('./routes/fee.routes');
const ocrRoutes = require('./routes/ocr.routes');

const { connectMongo } = require('./config/mongo');

app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/ocr', ocrRoutes);

const startServer = async (retries = 5, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Connecting to PostgreSQL database (Attempt ${attempt}/${retries})...`);
      await prisma.$connect();
      console.log('--- 🛡️ Database connection established successfully with PostgreSQL / Prisma ---');
      await connectMongo();

      app.listen(config.port, () => {
        console.log(`========================================================================`);
        console.log(`🏫 SHREE DHANESHKUMAR JASVANTLAL MAHETA HIGH SCHOOL ERP SERVER (Est. 1959)`);
        console.log(`🚀 API Server active on: http://localhost:${config.port}/api`);
        console.log(`🌐 Health Check Diagnostic: http://localhost:${config.port}/health`);
        console.log(`========================================================================`);
      });
      return;
    } catch (err) {
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) {
        console.error('❌ Fatal error connecting to database or starting server:', err);
        process.exit(1);
      }
      console.log(`⏳ Retrying database connection in ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

startServer();

// Handle unexpected Node rejections and clean shutdowns
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection at Promise:', reason);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: shutting down HTTP server and Prisma client.');
  await prisma.$disconnect();
  process.exit(0);
});
