// Temporary storage for registration data before OTP verification
// In production, use Redis or another external cache
interface PendingRegistration {
  registrationData: any;
  otp: string;
  otpExpires: Date;
  email: string;
}

const pendingRegistrations = new Map<string, PendingRegistration>();

export const storePendingRegistration = (sessionId: string, data: PendingRegistration) => {
  console.log('💾 [PENDING REGISTRATIONS] Storing registration for sessionId:', sessionId);
  console.log('💾 [PENDING REGISTRATIONS] Data:', {
    email: data.email,
    otp: data.otp,
    otpExpires: data.otpExpires.toISOString(),
    hasRegistrationData: !!data.registrationData
  });
  
  pendingRegistrations.set(sessionId, data);
  console.log('💾 [PENDING REGISTRATIONS] Total pending registrations:', pendingRegistrations.size);
  
  // Clean up expired entries
  setTimeout(() => {
    const registration = pendingRegistrations.get(sessionId);
    if (registration && registration.otpExpires < new Date()) {
      console.log('🧹 [PENDING REGISTRATIONS] Cleaning up expired session:', sessionId);
      pendingRegistrations.delete(sessionId);
    }
  }, 10 * 60 * 1000); // 10 minutes
};

export const getPendingRegistration = (sessionId: string): PendingRegistration | undefined => {
  console.log('🔍 [PENDING REGISTRATIONS] Looking up sessionId:', sessionId);
  const registration = pendingRegistrations.get(sessionId);
  
  if (!registration) {
    console.log('❌ [PENDING REGISTRATIONS] No registration found for sessionId:', sessionId);
    return undefined;
  }
  
  if (registration.otpExpires < new Date()) {
    console.log('⏰ [PENDING REGISTRATIONS] Registration expired for sessionId:', sessionId);
    pendingRegistrations.delete(sessionId);
    return undefined;
  }
  
  console.log('✅ [PENDING REGISTRATIONS] Found valid registration for sessionId:', sessionId);
  return registration;
};

export const removePendingRegistration = (sessionId: string) => {
  pendingRegistrations.delete(sessionId);
};

export const generateSessionId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
