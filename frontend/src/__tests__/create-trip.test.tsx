import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateTripPage from '@/app/driver/create-trip/page';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/driver/create-trip',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useAppStore
const mockCreateTrip = jest.fn();
const mockClearError = jest.fn();
jest.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({
    createTrip: mockCreateTrip,
    lastError: null,
    clearError: mockClearError,
    language: 'en',
  }),
}));

// Mock map components to avoid loading leaflet in jsdom
jest.mock('@/components/ui/Map', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  LocationPicker: () => <div data-testid="location-picker">Location Picker</div>,
}));

// Mock ProtectedRoute since we don't have full auth state context here
jest.mock('@/components/auth/ProtectedRoute', () => {
  return function DummyProtectedRoute({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

describe('CreateTripPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateTripPage />
      </QueryClientProvider>
    );
  };

  it('renders the first step correctly (Route Selection)', () => {
    renderComponent();
    
    // Check that we are on step 1 (Route)
    expect(screen.getByText('Route')).toBeInTheDocument();
    
    // Check fields
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    
    // Next button should be present
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
  });

  it('shows validation errors when moving to the next step without choosing cities', async () => {
    renderComponent();
    
    // Click Next button
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Wait for the form validation errors to show up.
    // By default, since CitySelect uses a list of cities, we expect validation to trigger.
    await waitFor(() => {
      const errors = screen.queryAllByText('Required field');
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
