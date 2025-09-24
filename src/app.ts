import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import patientRoutes from "./routes/patient.routes";
import documentRoutes from "./routes/document.routes";
import backupRoutes from "./routes/backup.routes";
import metricsRoutes from './routes/metrics.routes';
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// CORS configuration - must be early in middleware stack
const corsOptions = {
  origin: [
    "https://carekeep.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// Removed the problematic app.options('*', cors(corsOptions)) line

app.use(express.json());
app.use(morgan("dev"));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/backups", backupRoutes);
app.use('/api/metrics', metricsRoutes);

app.use(errorHandler);

export default app;