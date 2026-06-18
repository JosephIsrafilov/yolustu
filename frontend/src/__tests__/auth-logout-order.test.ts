import { createAuthSlice } from '@/store/slices/createAuthSlice';
import { authService } from '@/services';

jest.mock('@/services', () => ({
  authService: {
    logout: jest.fn(),
  },
  adminService: {},
}));

describe('auth logout ordering', () => {
  it('keeps auth state until server logout finishes', async () => {
    let resolveLogout!: () => void;
    const pendingLogout = new Promise<void>((resolve) => {
      resolveLogout = resolve;
    });
    jest.mocked(authService.logout).mockReturnValueOnce(pendingLogout);

    const state: Record<string, unknown> = {};
    const set = (partial: unknown) => {
      const update =
        typeof partial === 'function'
          ? partial(state)
          : partial;
      Object.assign(state, update);
    };
    const get = () => state;

    Object.assign(
      state,
      createAuthSlice(
        set as never,
        get as never,
        {} as never,
      ),
      {
        isAuthenticated: true,
        authStatus: 'authenticated',
        currentUser: { id: 'user-1' },
      },
    );

    const logoutPromise = (state.logout as () => Promise<void>)();
    await Promise.resolve();

    expect(state.isAuthenticated).toBe(true);
    expect(state.authStatus).toBe('authenticated');

    resolveLogout();
    await logoutPromise;

    expect(state.isAuthenticated).toBe(false);
    expect(state.authStatus).toBe('unauthenticated');
    expect(state.currentUser).toBeNull();
  });
});
