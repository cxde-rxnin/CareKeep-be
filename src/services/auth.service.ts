import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";
import { JWT_SECRET } from "../config/env";
import { sendOTPEmail, generateOTP } from "./email.service";
import { 
  storePendingRegistration, 
  getPendingRegistration, 
  removePendingRegistration, 
  generateSessionId 
} from "../utils/pendingRegistrations";

// Step 1: Send OTP for registration (don't create user yet)
export const initiateRegistration = async (data: Partial<IUser>) => {
  console.log('🔍 [AUTH SERVICE] Starting initiate registration with data:', {
    email: data.email,
    hospitalName: data.hospitalName,
    address: data.address,
    phoneNumber: data.phoneNumber
  });

  // Check if email already exists
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    console.log('❌ [AUTH SERVICE] Email already exists:', data.email);
    throw new Error("Email already registered");
  }

  console.log('✅ [AUTH SERVICE] Email is available, generating OTP...');
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  const sessionId = generateSessionId();
  
  console.log('📝 [AUTH SERVICE] Generated:', {
    sessionId,
    otp,
    otpExpires: otpExpires.toISOString()
  });

  // Store registration data temporarily (not in database)
  storePendingRegistration(sessionId, {
    registrationData: data,
    otp,
    otpExpires,
    email: data.email!
  });
  
  console.log('💾 [AUTH SERVICE] Stored pending registration for session:', sessionId);

  try {
    console.log('📧 [AUTH SERVICE] Attempting to send OTP email to:', data.email);
    await sendOTPEmail(data.email!, otp, data.hospitalName!);
    console.log('✅ [AUTH SERVICE] OTP email sent successfully');
  } catch (emailError: any) {
    console.error('❌ [AUTH SERVICE] Failed to send OTP email:', emailError);
    throw new Error(`Failed to send verification email: ${emailError.message}`);
  }
  
  console.log('🎉 [AUTH SERVICE] Registration initiation completed successfully');
  return { 
    message: "Verification code sent to your email. Please verify to complete registration.",
    sessionId 
  };
};

// Step 2: Verify OTP and complete registration
export const verifyOTPAndRegister = async (sessionId: string, otp: string) => {
  const pendingRegistration = getPendingRegistration(sessionId);
  
  if (!pendingRegistration) {
    throw new Error("Registration session expired or not found");
  }
  
  if (pendingRegistration.otpExpires < new Date()) {
    removePendingRegistration(sessionId);
    throw new Error("OTP has expired");
  }
  
  if (pendingRegistration.otp !== otp) {
    throw new Error("Invalid OTP");
  }
  
  // OTP is valid, now create the user
  const { registrationData } = pendingRegistration;
  const hashedPassword = await bcrypt.hash(registrationData.password!, 10);
  
  const user = new User({ 
    ...registrationData, 
    password: hashedPassword
  });
  
  const savedUser = await user.save();
  
  removePendingRegistration(sessionId);
  
  const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, JWT_SECRET, {
    expiresIn: "1d"
  });
  
  const { password: _, ...userWithoutPassword } = savedUser.toObject();
  
  return { 
    message: "Registration completed successfully!",
    user: userWithoutPassword, 
    token 
  };
};

// Resend OTP for registration
export const resendRegistrationOTP = async (sessionId: string) => {
  const pendingRegistration = getPendingRegistration(sessionId);
  
  if (!pendingRegistration) {
    throw new Error("Registration session not found or expired");
  }
  
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  // Update the pending registration with new OTP
  storePendingRegistration(sessionId, {
    ...pendingRegistration,
    otp,
    otpExpires
  });
  
  // Send new OTP email
  await sendOTPEmail(
    pendingRegistration.email, 
    otp, 
    pendingRegistration.registrationData.hospitalName!
  );
  
  return { message: "New verification code sent to your email" };
};

export const loginUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d"
  });

  const { password: _, ...userWithoutPassword } = user.toObject();

  return { user: userWithoutPassword, token };
};

// Retrieve profile (excluding password)
export const getProfile = async (userId: string) => {
  const user = await User.findById(userId).select('-password');
  if (!user) throw new Error('User not found');
  return user;
};

// Update profile with allowed fields and email uniqueness check
export const updateProfile = async (userId: string, data: Partial<IUser>) => {
  const allowedFields: (keyof IUser)[] = ['hospitalName', 'address', 'phoneNumber'];

  // If email provided, validate uniqueness and allow update
  if (data.email && data.email.trim()) {
    const existing = await User.findOne({ email: data.email, _id: { $ne: userId } });
    if (existing) throw new Error('Email already in use');
    allowedFields.push('email');
  }

  const updates: Partial<IUser> = {} as any;
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      (updates as any)[field] = data[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No valid fields provided for update');
  }

  const updated = await User.findByIdAndUpdate(userId, updates, { new: true })
    .select('-password');
  if (!updated) throw new Error('User not found');
  return updated;
};
