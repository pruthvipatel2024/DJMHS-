const config = require('../config');

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred on the institutional server.';

  // Custom parsing for Zod validation error structures
  if (err.name === 'ZodError' || err.issues) {
    const issues = err.issues || [];
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_FAILED',
      error: 'Validation Failed',
      message: 'One or more submitted fields failed validation.',
      details: issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  // Handle Prisma Validation & Schema Errors
  if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    errorCode = 'DATABASE_VALIDATION_ERROR';
    message = 'Data operation invalid: Schema argument mismatch detected.';
  } else if (err.name === 'PrismaClientInitializationError') {
    statusCode = 503;
    errorCode = 'DATABASE_CONNECTION_ERROR';
    message = 'Database connection temporarily unavailable. Please retry in a few moments.';
  } else if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      statusCode = 409;
      errorCode = 'DUPLICATE_ENTRY_CONFLICT';
      message = 'A record with this unique attribute already exists in the system database.';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      errorCode = 'RECORD_NOT_FOUND';
      message = 'The requested resource could not be located in the database.';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      errorCode = 'FOREIGN_KEY_CONSTRAINT_FAILED';
      message = 'Referenced relational record does not exist.';
    } else {
      statusCode = 400;
      errorCode = `PRISMA_ERROR_${err.code}`;
      message = 'Database transaction failed due to a relational constraint violation.';
    }
  }

  console.error(`[Error Handler] ${errorCode}:`, err.message || err);

  res.status(statusCode).json({
    success: false,
    code: errorCode,
    error: err.name || 'Internal Server Error',
    message: message,
    stack: config.env === 'development' ? err.stack : undefined,
  });
};

const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource Not Found — ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFoundHandler };
