import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/initiate-registration", authController.initiateRegistration);
router.post("/verify-registration", authController.verifyOTPAndRegister);
router.post("/resend-registration-otp", authController.resendRegistrationOTP);
router.post("/login", authController.login);

// Profile routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

export default router;
