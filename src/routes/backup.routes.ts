import { Router } from "express";
import * as backupController from "../controllers/backup.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, backupController.create);
router.get("/", authMiddleware, backupController.list);
router.get("/:id/download", authMiddleware, backupController.download);

export default router;
