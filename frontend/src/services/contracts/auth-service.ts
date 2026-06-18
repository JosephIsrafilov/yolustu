import type { User } from '@/types';

export interface LoginInput {
  phone: string;
  password: string;
}

export interface VerifyOtpInput {
  phone: string;
  otp: string;
}

export interface RegisterInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface AuthService {
  login(input: LoginInput): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  requestOtp(phone: string): Promise<void>;
  verifyOtp(input: VerifyOtpInput): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
  requestEmailVerification(): Promise<void>;
  verifyEmail(otp: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
  submitVerification(file: File): Promise<User>;
  uploadAvatar(file: File): Promise<User>;
  registerDeviceToken(token: string): Promise<void>;
}
