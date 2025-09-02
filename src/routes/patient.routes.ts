import { Router } from "express";
import * as patientController from "../controllers/patient.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, patientController.createPatient);
router.get("/", authMiddleware, patientController.listPatients);
router.get("/:id", authMiddleware, patientController.getPatient);
router.put("/:id", authMiddleware, patientController.updatePatient);

export default router;
