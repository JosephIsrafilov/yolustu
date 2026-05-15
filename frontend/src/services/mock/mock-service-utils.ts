import { ApiError, type ApiErrorCode } from '@/services/api-error';
import { useAppStore } from '@/store/useAppStore';

export function buildStoreError(
  fallbackMessage: string,
  code: ApiErrorCode = 'VALIDATION_ERROR',
): ApiError {
  const message = useAppStore.getState().lastError || fallbackMessage;
  return new ApiError({ code, message });
}

export function requireCurrentUser() {
  const user = useAppStore.getState().currentUser;
  if (!user) {
    throw new ApiError({
      code: 'UNAUTHORIZED',
      message: 'Authentication is required.',
    });
  }
  return user;
}

export function requireAdminUser() {
  const user = requireCurrentUser();
  if (user.role !== 'admin') {
    throw new ApiError({
      code: 'FORBIDDEN',
      message: 'Admin access is required.',
    });
  }
  return user;
}
