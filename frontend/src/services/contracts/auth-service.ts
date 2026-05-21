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
  password: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface AuthService {
  login(input: LoginInput): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  requestOtp(phone: string): Promise<void>;
  verifyOtp(input: VerifyOtpInput): Promise<void>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
  submitVerification(file: File): Promise<User>;
  registerDeviceToken(token: string): Promise<void>;
}
