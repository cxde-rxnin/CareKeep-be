import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import patientRoutes from "./routes/patient.routes";
import documentRoutes from "./routes/document.routes";
import backupRoutes from "./routes/backup.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(express.json());
// configure CORS to allow the frontend origin and credentials
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
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

app.use(errorHandler);

export default app;
