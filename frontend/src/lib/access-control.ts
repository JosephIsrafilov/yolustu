import type { User } from '@/types';

export type ActiveMode = 'passenger' | 'driver';
export type DriverStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface UserCapabilities {
  canAccessAdmin: boolean;
  canAccessDriverDashboard: boolean;
  canOfferRide: boolean;
  canApplyForDriver: boolean;
  canBookRide: boolean;
  canManageUsers: boolean;
  canManageTrips: boolean;
  canManageBookings: boolean;
  driverStatus: DriverStatus;
  activeMode: ActiveMode;
}

function normalizeActiveMode(mode: ActiveMode | undefined): ActiveMode {
  return mode === 'driver' ? 'driver' : 'passenger';
}

function resolveDriverStatus(user: User | null): DriverStatus {
  if (!user) return 'none';

  if (user.verificationStatus === 'approved') return 'approved';
  if (user.verificationStatus === 'pending') return 'pending';
  if (user.verificationStatus === 'rejected') return 'rejected';

  if (user.role === 'driver') {
    // Backward-compatible fallback for legacy mock users that still have `verificationStatus: 'none'`.
    if (user.verificationStatus === 'none') return 'approved';
    return 'approved';
  }
  return 'none';
}

export function getUserCapabilities(
  user: User | null,
  isAuthenticated: boolean,
  activeModeInput?: ActiveMode
): UserCapabilities {
  // Frontend-only visibility/redirect helper.
  // Real authorization must be enforced by backend RBAC/JWT checks on every protected endpoint.
  const activeMode = normalizeActiveMode(activeModeInput);

  if (!user || !isAuthenticated) {
    return {
      canAccessAdmin: false,
      canAccessDriverDashboard: false,
      canOfferRide: false,
      canApplyForDriver: false,
      canBookRide: false,
      canManageUsers: false,
      canManageTrips: false,
      canManageBookings: false,
      driverStatus: 'none',
      activeMode,
    };
  }

  const isAdmin = user.role === 'admin';
  const driverStatus = resolveDriverStatus(user);
  const canAccessDriverDashboard = !isAdmin && driverStatus === 'approved';
  const canOfferRide = canAccessDriverDashboard;
  const canApplyForDriver = !isAdmin && driverStatus !== 'approved';
  const canBookRide = !isAdmin && (activeMode === 'passenger' || !canAccessDriverDashboard);

  return {
    canAccessAdmin: isAdmin,
    canAccessDriverDashboard,
    canOfferRide,
    canApplyForDriver,
    canBookRide,
    canManageUsers: isAdmin,
    canManageTrips: isAdmin,
    canManageBookings: isAdmin,
    driverStatus,
    activeMode,
  };
}
