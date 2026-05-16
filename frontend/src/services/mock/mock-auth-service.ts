import { ApiError } from '@/services/api-error';
import type {
  AuthService,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  VerifyOtpInput,
} from '@/services/contracts/auth-service';
import { useAppStore } from '@/store/useAppStore';
import type { User } from '@/types';
import { validatePassword } from '@/lib/mock-api';
import { requireCurrentUser } from '@/services/mock/mock-service-utils';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `u-${Date.now()}`;
}

export const mockAuthService: AuthService = {
  async login(input: LoginInput) {
    if (!validatePassword(input.password)) {
      throw new ApiError({
        code: 'UNAUTHORIZED',
        message: 'Invalid phone or password.',
      });
    }

    const user = useAppStore
      .getState()
      .users.find((item) => item.phone === input.phone && !item.isBlocked);
    if (!user) {
      throw new ApiError({
        code: 'UNAUTHORIZED',
        message: 'Invalid phone or password.',
      });
    }

    return user;
  },

  async register(input: RegisterInput) {
    const state = useAppStore.getState();
    const existingUser = state.users.find((user) => user.phone === input.phone);
    if (existingUser) {
      throw new ApiError({
        code: 'CONFLICT',
        message: 'User already exists.',
      });
    }

    const user: User = {
      id: createId(),
      fullName: input.fullName,
      email: `${input.phone.replace(/\D/g, '')}@mock.yolustu.local`,
      phone: input.phone,
      city: '',
      role: 'passenger',
      rating: 0,
      totalTrips: 0,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };
    useAppStore.setState((current) => ({
      users: [user, ...current.users],
    }));
    return user;
  },

  async requestOtp() {
    return;
  },

  async verifyOtp(input: VerifyOtpInput) {
    if (input.otp.length !== 6) {
      throw new ApiError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid OTP.',
      });
    }
  },

  async logout() {
    return;
  },

  async getCurrentUser() {
    return useAppStore.getState().currentUser;
  },

  async updateProfile(input: UpdateProfileInput) {
    const currentUser = requireCurrentUser();
    const updatedUser: User = {
      ...currentUser,
      fullName: input.fullName ?? currentUser.fullName,
      phone: input.phone ?? currentUser.phone,
      city: input.city ?? currentUser.city,
      bio: input.bio ?? currentUser.bio,
      avatarUrl: input.avatarUrl ?? currentUser.avatarUrl,
    };

    useAppStore.setState((state) => ({
      currentUser: updatedUser,
      users: state.users.map((user) => (user.id === updatedUser.id ? updatedUser : user)),
    }));
    return updatedUser;
  },
};
