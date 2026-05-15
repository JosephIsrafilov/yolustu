import { apiClient } from '@/services/api-client';
import type {
  AuthService,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/services/contracts/auth-service';
import { mapApiUserToUser, type ApiUser } from './mappers';

export const apiAuthService: AuthService = {
  async login(input: LoginInput) {
    const payload = { phone: input.phone, password: input.password };
    const res = await apiClient.post<{ access_token: string }>('/auth/login', payload);
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
    };
    await apiClient.post<unknown>('/auth/register', payload);
    return this.login({ phone: input.phone, password: input.password });
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
