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

app.use(express.json());
const corsOptions = {
  origin: process.env.FRONTEND_URL || "https://carekeep.vercel.app",
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(helmet());

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/backups", backupRoutes);
app.use('/api/metrics', metricsRoutes);

app.use(errorHandler);

export default app;
