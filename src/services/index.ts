import { env } from '@/lib/env';
import { apiAdminService } from '@/services/api/api-admin-service';
import { apiAuthService } from '@/services/api/api-auth-service';
import { apiBookingsService } from '@/services/api/api-bookings-service';
import { apiReviewsService } from '@/services/api/api-reviews-service';
import { apiTripsService } from '@/services/api/api-trips-service';
import type { AdminService } from '@/services/contracts/admin-service';
import type { AuthService } from '@/services/contracts/auth-service';
import type { BookingsService } from '@/services/contracts/bookings-service';
import type { ReviewsService } from '@/services/contracts/reviews-service';
import type { TripsService } from '@/services/contracts/trips-service';
import { mockAdminService } from '@/services/mock/mock-admin-service';
import { mockAuthService } from '@/services/mock/mock-auth-service';
import { mockBookingsService } from '@/services/mock/mock-bookings-service';
import { mockReviewsService } from '@/services/mock/mock-reviews-service';
import { mockTripsService } from '@/services/mock/mock-trips-service';

const useMockServices = env.dataMode === 'mock';

export const authService: AuthService = useMockServices
  ? mockAuthService
  : apiAuthService;

export const tripsService: TripsService = useMockServices
  ? mockTripsService
  : apiTripsService;

export const bookingsService: BookingsService = useMockServices
  ? mockBookingsService
  : apiBookingsService;

export const reviewsService: ReviewsService = useMockServices
  ? mockReviewsService
  : apiReviewsService;

export const adminService: AdminService = useMockServices
  ? mockAdminService
  : apiAdminService;
