import { Router } from "express";
import multer from "multer";
import * as documentController from "../controllers/document.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const upload = multer({ dest: "uploads/" });
const router = Router();

router.post("/upload", authMiddleware, upload.single("file"), documentController.uploadDocument);

export default router;
