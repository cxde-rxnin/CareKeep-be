import { Router } from "express";
import multer from "multer";
import * as documentController from "../controllers/document.controller";
import { authMiddleware } from "../middleware/auth.middleware";

// Use memory storage for serverless environments
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
const router = Router();

router.post("/upload", authMiddleware, upload.single("file"), documentController.uploadDocument);
router.get("/patient/:patientId", authMiddleware, documentController.getDocumentsByPatient);
router.get("/:id", authMiddleware, documentController.getDocument);

export default router;
