import type { User } from '@/types';

export interface LoginInput {
  phone: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
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
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  updateProfile(input: UpdateProfileInput): Promise<User>;
}
