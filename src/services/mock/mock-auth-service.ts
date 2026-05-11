import { ApiError } from '@/services/api-error';
import type {
  AuthService,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@/services/contracts/auth-service';
import { useAppStore } from '@/store/useAppStore';
import { buildStoreError, requireCurrentUser } from '@/services/mock/mock-service-utils';

export const mockAuthService: AuthService = {
  async login(input: LoginInput) {
    const ok = useAppStore.getState().login(input.email, input.password);
    if (!ok) {
      throw buildStoreError('Login failed.', 'UNAUTHORIZED');
    }

    const user = useAppStore.getState().currentUser;
    if (!user) {
      throw new ApiError({
        code: 'UNKNOWN_ERROR',
        message: 'Login completed but user is missing.',
      });
    }
    return user;
  },

  async register(input: RegisterInput) {
    useAppStore.getState().register(input);
    const user = useAppStore.getState().currentUser;
    if (!user) {
      throw new ApiError({
        code: 'UNKNOWN_ERROR',
        message: 'Registration completed but user is missing.',
      });
    }
    return user;
  },

  async logout() {
    useAppStore.getState().logout();
  },

  async getCurrentUser() {
    return useAppStore.getState().currentUser;
  },

  async updateProfile(input: UpdateProfileInput) {
    requireCurrentUser();
    useAppStore.getState().updateProfile(input);
    const user = useAppStore.getState().currentUser;
    if (!user) {
      throw new ApiError({
        code: 'UNKNOWN_ERROR',
        message: 'Profile was updated but user is missing.',
      });
    }
    return user;
  },
};
