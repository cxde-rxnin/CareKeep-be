import { Request, Response } from "express";
import * as authService from "../services/auth.service";

export const initiateRegistration = async (req: Request, res: Response) => {
  console.log('🚀 [AUTH CONTROLLER] Received registration request');
  console.log('📝 [AUTH CONTROLLER] Request body:', req.body);
  
  try {
    const result = await authService.initiateRegistration(req.body);
    console.log('✅ [AUTH CONTROLLER] Registration initiated successfully');
    console.log('📤 [AUTH CONTROLLER] Sending response:', result);
    res.json(result);
  } catch (err: any) {
    console.error('❌ [AUTH CONTROLLER] Registration failed:', {
      error: err.message,
      stack: err.stack
    });
    res.status(400).json({ error: err.message });
  }
};

export const verifyOTPAndRegister = async (req: Request, res: Response) => {
  try {
    const { sessionId, otp } = req.body;
    const result = await authService.verifyOTPAndRegister(sessionId, otp);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const resendRegistrationOTP = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    const result = await authService.resendRegistrationOTP(sessionId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await authService.getProfile(userId);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await authService.updateProfile(userId, req.body);
    res.json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
