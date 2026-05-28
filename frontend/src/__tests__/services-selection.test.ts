/* eslint-disable @typescript-eslint/no-require-imports */

describe('services exports', () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.NEXT_PUBLIC_DATA_MODE;
  });

  it('exports api service implementations', () => {
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
});
