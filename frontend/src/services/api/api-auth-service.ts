import { apiClient } from '@/services/api-client';
import type {
  AuthService,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/services/contracts/auth-service';
import type { User } from '@/types';

export const apiAuthService: AuthService = {
  async login(input: LoginInput) {
    const payload = { email: input.email, password: input.password };
    const res = await apiClient.post<{ access_token: string }>('/auth/login', payload);
    localStorage.setItem('token', res.access_token);
    const user = await apiClient.get<User | null>('/users/me');
    if (!user) throw new Error('User not found after login');
    return user;
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
    return this.login({ email: input.phone, password: input.password });
  },

  async logout() {
    localStorage.removeItem('token');
  },

  async getCurrentUser() {
    return apiClient.get<User | null>('/users/me');
  },

  async updateProfile(input: UpdateProfileInput) {
    return apiClient.put<User>('/users/me', input);
  },
};
