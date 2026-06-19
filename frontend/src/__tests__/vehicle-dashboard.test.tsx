import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import DriverVehiclePage from '@/app/driver/vehicle/page';
import { vehiclesService } from '@/services';

jest.mock('@/services', () => ({
  vehiclesService: {
    getMyVehicles: jest.fn(),
    createVehicle: jest.fn(),
    updateVehicle: jest.fn(),
    setDefaultVehicle: jest.fn(),
    deactivateVehicle: jest.fn(),
  },
}));

jest.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({ language: 'en' }),
}));

jest.mock('@/components/auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/driver/DriverLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedVehiclesService = vehiclesService as jest.Mocked<typeof vehiclesService>;

describe('vehicle dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedVehiclesService.getMyVehicles.mockResolvedValue([
      {
        id: 'vehicle-default',
        userId: 'driver-1',
        brand: 'Toyota',
        model: 'Prius',
        year: 2022,
        color: 'white',
        plateNumber: '99-AA-111',
        seatsCount: 4,
        isActive: true,
        isDefault: true,
        verificationStatus: 'approved' as const,
        createdAt: '2026-06-19T10:00:00Z',
      },
      {
        id: 'vehicle-secondary',
        userId: 'driver-1',
        brand: 'Kia',
        model: 'Rio',
        year: 2021,
        color: 'black',
        plateNumber: '99-BB-222',
        seatsCount: 2,
        isActive: true,
        isDefault: false,
        verificationStatus: 'none' as const,
        createdAt: '2026-06-19T10:00:00Z',
      },
    ]);
    mockedVehiclesService.setDefaultVehicle.mockResolvedValue({} as never);
    mockedVehiclesService.deactivateVehicle.mockResolvedValue();
  });

  it('shows status/default badges and performs vehicle actions', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DriverVehiclePage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Toyota Prius')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /Set as default/i }));
    await waitFor(() => {
      expect(mockedVehiclesService.setDefaultVehicle).toHaveBeenCalledWith('vehicle-secondary');
    });

    const deactivateButtons = screen.getAllByRole('button', { name: /Deactivate/i });
    fireEvent.click(deactivateButtons[0]);
    await waitFor(() => {
      expect(mockedVehiclesService.deactivateVehicle).toHaveBeenCalledWith('vehicle-default');
    });
  });
});
