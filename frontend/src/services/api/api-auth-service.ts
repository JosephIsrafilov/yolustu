import { apiClient } from '@/services/api-client';
import type {
  AuthService,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  VerifyOtpInput,
} from '@/services/contracts/auth-service';
import { mapApiUserToUser, type ApiUser } from './mappers';

export const apiAuthService: AuthService = {
  async login(input: LoginInput) {
    const res = await apiClient.post<{ access_token: string }>('/auth/login', input);
    localStorage.setItem('token', res.access_token);
    const user = await apiClient.get<ApiUser | null>('/users/me');
    if (!user) throw new Error('User not found after login');
    return mapApiUserToUser(user);
  },

  async register(input: RegisterInput) {
    const names = input.fullName.trim().split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || ' ';
    const payload = {
      phone: input.phone,
      first_name: firstName,
      last_name: lastName,
      password: input.password,
    };
    const user = await apiClient.post<ApiUser>('/auth/register', payload);
    return mapApiUserToUser(user);
  },

  async requestOtp(phone: string) {
    await apiClient.post<unknown>(`/auth/request-otp?phone=${encodeURIComponent(phone)}`);
  },

  async verifyOtp(input: VerifyOtpInput) {
    await apiClient.post<unknown>(
      `/auth/verify-otp?phone=${encodeURIComponent(input.phone)}&otp=${encodeURIComponent(input.otp)}`
    );
  },

  async logout() {
    localStorage.removeItem('token');
  },

  async getCurrentUser() {
    const user = await apiClient.get<ApiUser | null>('/users/me');
    return user ? mapApiUserToUser(user) : null;
  },

  async updateProfile(input: UpdateProfileInput) {
    const names = input.fullName?.trim().split(/\s+/) ?? [];
    const payload = {
      phone: input.phone,
      first_name: names[0],
      last_name: names.length > 1 ? names.slice(1).join(' ') : undefined,
      avatar_url: input.avatarUrl,
    };
    const user = await apiClient.put<ApiUser>('/users/me', payload);
    return mapApiUserToUser(user);
  },
};
