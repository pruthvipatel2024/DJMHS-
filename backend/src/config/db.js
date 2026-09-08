const { PrismaClient } = require('@prisma/client');

// Format DATABASE_URL to guarantee PgBouncer & connection pool options for Neon Serverless PostgreSQL
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl && dbUrl.includes('-pooler') && !dbUrl.includes('pgbouncer=true')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${separator}pgbouncer=true&connect_timeout=15&pool_timeout=30&connection_limit=10`;
}

const rawPrisma = new PrismaClient({
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Helper to check if an error is a transient PostgreSQL / Neon connection drop
const isConnectionDropError = (err) => {
  if (!err) return false;
  const str = String(err.message || err);
  return (
    str.includes('Closed') ||
    str.includes('kind: Closed') ||
    str.includes('P1001') ||
    str.includes('P1017') ||
    str.includes('Connection closed') ||
    str.includes('Engine closed') ||
    str.includes('ECONNRESET') ||
    str.includes('ETIMEDOUT') ||
    str.includes('Broken pipe') ||
    str.includes('connection to the server was lost')
  );
};

// Resilient Prisma Client with automatic reconnection and query retry
const prismaWithRetry = rawPrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
          try {
            return await query(args);
          } catch (error) {
            attempts++;
            if (isConnectionDropError(error) && attempts < maxAttempts) {
              console.warn(`⚠️ [Prisma] Detected connection drop on ${model}.${operation}. Reconnecting & retrying (attempt ${attempts}/${maxAttempts})...`);
              try {
                await rawPrisma.$connect();
              } catch (reconnectErr) {
                // Ignore reconnect error on intermediate attempt
              }
              // Exponential backoff delay: 150ms, 300ms, etc.
              await new Promise((resolve) => setTimeout(resolve, attempts * 150));
              continue;
            }
            throw error;
          }
        }
      },
    },
  },
});

// Preserve singleton across Nodemon reload
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || prismaWithRetry;
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// =========================================================================
// Active 2-Minute Heartbeat / Keep-Alive Ping for Neon Serverless PostgreSQL
// Prevents PgBouncer and Neon compute sleep idle disconnects
// =========================================================================
let heartbeatInterval = null;
const startDbHeartbeat = () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  heartbeatInterval = setInterval(async () => {
    try {
      await rawPrisma.$queryRawUnsafe('SELECT 1');
    } catch (err) {
      if (isConnectionDropError(err)) {
        console.log('🔄 [Prisma Heartbeat] Re-establishing idle Neon PostgreSQL connection...');
        try {
          await rawPrisma.$connect();
          console.log('✅ [Prisma Heartbeat] Neon PostgreSQL connection restored successfully.');
        } catch (reconnectErr) {
          console.warn('⚠️ [Prisma Heartbeat] Reconnection attempt warning:', reconnectErr.message);
        }
      }
    }
  }, 120 * 1000); // Ping every 2 minutes (120s) to comfortably precede Neon's 300s timeout

  if (heartbeatInterval.unref) {
    heartbeatInterval.unref(); // Allow Node to exit cleanly if process is terminating
  }
};

startDbHeartbeat();

module.exports = prisma;
