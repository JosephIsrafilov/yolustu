import { apiClient } from '@/services/api-client';
import { apiVehiclesService } from '@/services/api/api-vehicles-service';
import { mapApiVehicleToVehicle, type ApiVehicle } from '@/services/api/mappers';

jest.mock('@/services/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const apiVehicle: ApiVehicle = {
  id: 'vehicle-1',
  user_id: 'driver-1',
  brand: 'Toyota',
  model: 'Prius',
  year: 2022,
  color: 'white',
  plate_number: '99-XX-123',
  seats_count: 3,
  is_active: true,
  is_default: true,
  created_at: '2026-06-19T10:00:00Z',
};

describe('api vehicle service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps vehicle management fields', () => {
    expect(mapApiVehicleToVehicle(apiVehicle)).toMatchObject({
      id: 'vehicle-1',
      seatsCount: 3,
      isActive: true,
      isDefault: true,
    });
  });

  it('keeps older vehicle responses compatible', () => {
    expect(mapApiVehicleToVehicle({
      ...apiVehicle,
      seats_count: undefined,
      is_active: undefined,
      is_default: undefined,
    })).toMatchObject({
      seatsCount: 4,
      isActive: true,
      isDefault: false,
    });
  });

  it('maps create and edit payloads', async () => {
    mockedApiClient.post.mockResolvedValue(apiVehicle);
    mockedApiClient.patch.mockResolvedValue(apiVehicle);

    await apiVehiclesService.createVehicle({
      brand: 'Toyota',
      model: 'Prius',
      year: 2022,
      color: 'white',
      plateNumber: '99-XX-123',
      seatsCount: 3,
    });
    await apiVehiclesService.updateVehicle('vehicle-1', {
      color: 'black',
      seatsCount: 2,
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/vehicles', {
      brand: 'Toyota',
      model: 'Prius',
      year: 2022,
      color: 'white',
      plate_number: '99-XX-123',
      seats_count: 3,
    });
    expect(mockedApiClient.patch).toHaveBeenCalledWith('/vehicles/vehicle-1', {
      color: 'black',
      seats_count: 2,
    });
  });

  it('uses lifecycle endpoints for default and deactivate', async () => {
    mockedApiClient.post.mockResolvedValue(apiVehicle);
    mockedApiClient.delete.mockResolvedValue(undefined);

    await apiVehiclesService.setDefaultVehicle('vehicle-1');
    await apiVehiclesService.deactivateVehicle('vehicle-1');

    expect(mockedApiClient.post).toHaveBeenCalledWith('/vehicles/vehicle-1/set-default');
    expect(mockedApiClient.delete).toHaveBeenCalledWith('/vehicles/vehicle-1');
  });
});
