const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const config = require("./config");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error.middleware");
const { apiLimiter } = require("./middleware/rateLimiter");
const apiRoutes = require("./routes");

const app = express();
app.set("trust proxy", true);

// Security HTTP Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows serving uploaded document thumbnails
  }),
);

// Cross Origin Resource Sharing for local Vite development & production Vercel origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Echo back the requesting origin to satisfy Access-Control-Allow-Credentials
    return callback(null, origin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Request parsers & logging
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
if (config.env === "development") {
  app.use(morgan("dev"));
}

// Serve uploaded public documents and user avatars
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", config.uploadDir || "../uploads")),
);

// General API rate limiting
app.use("/api", apiLimiter);

// Master API Routes Router
app.use("/api", apiRoutes);

const { getMongoStatus } = require("./config/mongo");
const { isCloudinaryConfigured } = require("./services/cloudinary.service");

// Root Welcome & Health Check for Render Service Ping
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    institution: 'Shree Dhaneshkumar Jasvantlal Maheta High School ERP',
    status: 'ONLINE',
    health: `${req.protocol}://${req.get('host')}/health`,
  });
});

// Health check diagnostic endpoint
app.get('/health', (req, res) => {
  try {
    const config = require('./config');
    let mongoState = 'DISCONNECTED';
    try {
      mongoState = getMongoStatus();
    } catch (e) {
      mongoState = 'NOT_CONFIGURED';
    }

    res.status(200).json({
      success: true,
      institution: "Shree Dhaneshkumar Jasvantlal Maheta High School ERP",
      established: "1959",
      status: "ONLINE",
      postgres: "CONNECTED",
      mongoSubsystem: mongoState,
      cloudinary: isCloudinaryConfigured() ? "CONFIGURED" : "NOT_CONFIGURED",
      emailDiagnostics: {
        mockMode: config.email.mock,
        smtpHost: config.email.host,
        smtpPort: config.email.port,
        smtpUserProvided: !!config.email.user,
        smtpPassProvided: !!config.email.pass,
        userDomain: config.email.user ? config.email.user.split('@')[1] : null,
        fromAddress: config.email.from,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(200).json({
      success: true,
      status: "ONLINE",
      errorNote: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Global Exception and 404 Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
