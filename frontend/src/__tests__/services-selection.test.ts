/* eslint-disable @typescript-eslint/no-require-imports */

describe('services selection by NEXT_PUBLIC_DATA_MODE', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.NEXT_PUBLIC_DATA_MODE;
  });

  it('uses api services when NEXT_PUBLIC_DATA_MODE=api', () => {
    process.env.NEXT_PUBLIC_DATA_MODE = 'api';

    jest.isolateModules(() => {
      const services = require('@/services');
      const { apiAuthService } = require('@/services/api/api-auth-service');
      const { apiTripsService } = require('@/services/api/api-trips-service');
      const { apiBookingsService } = require('@/services/api/api-bookings-service');
      expect(services.authService).toBe(apiAuthService);
      expect(services.tripsService).toBe(apiTripsService);
      expect(services.bookingsService).toBe(apiBookingsService);
    });
  });

  it('uses mock services when NEXT_PUBLIC_DATA_MODE=mock', () => {
    process.env.NEXT_PUBLIC_DATA_MODE = 'mock';

    jest.isolateModules(() => {
      const services = require('@/services');
      const { mockAuthService } = require('@/services/mock/mock-auth-service');
      const { mockTripsService } = require('@/services/mock/mock-trips-service');
      const { mockBookingsService } = require('@/services/mock/mock-bookings-service');
      expect(services.authService).toBe(mockAuthService);
      expect(services.tripsService).toBe(mockTripsService);
      expect(services.bookingsService).toBe(mockBookingsService);
    });
  });
});
