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
    return apiClient.post<User>('/auth/login', input);
  },

  async register(input: RegisterInput) {
    return apiClient.post<User>('/auth/register', input);
  },

  async logout() {
    await apiClient.post<unknown>('/auth/logout');
  },

  async getCurrentUser() {
    return apiClient.get<User | null>('/users/me');
  },

  async updateProfile(input: UpdateProfileInput) {
    return apiClient.put<User>('/users/me', input);
  },
};
