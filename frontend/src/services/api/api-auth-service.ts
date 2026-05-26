import { apiClient } from '@/services/api-client';
import type {
  AuthService,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  VerifyOtpInput,
} from '@/services/contracts/auth-service';
import { mapApiUserToUser, type ApiUser } from './mappers';

interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

function persistAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

export const apiAuthService: AuthService = {
  async login(input: LoginInput) {
    const session = await apiClient.post<AuthSessionResponse>('/auth/login', input);
    persistAuthTokens(session.accessToken, session.refreshToken);
    return mapApiUserToUser(session.user);
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
    const session = await apiClient.post<AuthSessionResponse>('/auth/register', payload);
    persistAuthTokens(session.accessToken, session.refreshToken);
    return mapApiUserToUser(session.user);
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
    localStorage.removeItem('refresh_token');
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
      city: input.city,
      bio: input.bio,
    };
    const user = await apiClient.put<ApiUser>('/users/me', payload);
    return mapApiUserToUser(user);
  },

  async submitVerification(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const user = await apiClient.post<ApiUser>('/users/me/verify', formData);
    return mapApiUserToUser(user);
  },

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const user = await apiClient.post<ApiUser>('/users/me/avatar', formData);
    return mapApiUserToUser(user);
  },

  async registerDeviceToken(token: string) {
    await apiClient.post('/users/me/device-token', { token });
  },
};
