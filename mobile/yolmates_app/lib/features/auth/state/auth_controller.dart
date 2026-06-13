import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/providers.dart';
import '../data/api_auth_repository.dart';
import '../data/app_user.dart';
import '../data/auth_mode.dart';
import '../data/auth_repository.dart';
import '../data/mock_auth_repository.dart';
import '../data/session_storage.dart';

/// Coarse auth/session status the router gates on.
enum AuthStatus {
  unknown, // bootstrapping (splash)
  onboarding, // first time onboarding screen
  unauthenticated, // no session -> login
  incompleteProfile, // session exists, profile not finished -> setup
  authenticated, // session + complete profile -> main app
  error, // session load failed -> splash error
}

class AuthState {
  final AuthStatus status;
  final AppUser? user;
  final String? errorMessage;

  const AuthState._(this.status, {this.user, this.errorMessage});

  const AuthState.unknown() : this._(AuthStatus.unknown);
  const AuthState.onboarding() : this._(AuthStatus.onboarding);
  const AuthState.unauthenticated() : this._(AuthStatus.unauthenticated);
  const AuthState.incompleteProfile(AppUser user)
      : this._(AuthStatus.incompleteProfile, user: user);
  const AuthState.authenticated(AppUser user)
      : this._(AuthStatus.authenticated, user: user);
  const AuthState.error(String message)
      : this._(AuthStatus.error, errorMessage: message);
}

// --- Providers ---------------------------------------------------------------

/// Platform-backed storage by default; overridden in tests with in-memory.
final sessionStorageProvider = Provider<SessionStorage>(
  (ref) => SecureSessionStorage(),
);

/// Binds to real API or mock based on --dart-define=API_MODE.
///
/// API mode: Uses backend via ApiAuthRepository.
/// Mock mode (default): Uses in-memory MockAuthRepository.
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) {
    if (AuthMode.isApi) {
      return ApiAuthRepository(
        ref.read(apiClientProvider),
        ref.read(authTokenStorageProvider),
        ref.read(sessionStorageProvider),
      );
    } else {
      return MockAuthRepository(ref.read(sessionStorageProvider));
    }
  },
);

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

// --- Controller --------------------------------------------------------------

class AuthController extends Notifier<AuthState> {
  AuthRepository get _repo => ref.read(authRepositoryProvider);

  @override
  AuthState build() {
    // Kick off the session check without blocking initial state.
    _bootstrap();
    return const AuthState.unknown();
  }

  Future<void> _bootstrap() async {
    state = const AuthState.unknown();
    try {
      final storage = ref.read(sessionStorageProvider);
      final onboardingSeen = await storage.read('onboarding_seen');
      if (onboardingSeen != 'true') {
        state = const AuthState.onboarding();
        return;
      }
      final user = await _repo.currentUser();
      state = _resolve(user);
    } catch (e) {
      state = AuthState.error(e.toString());
    }
  }

  AuthState _resolve(AppUser? user) {
    if (user == null) return const AuthState.unauthenticated();
    if (!user.isProfileComplete) return AuthState.incompleteProfile(user);
    return AuthState.authenticated(user);
  }

  /// Mark onboarding as completed.
  Future<void> markOnboardingSeen() async {
    final storage = ref.read(sessionStorageProvider);
    await storage.write('onboarding_seen', 'true');
    state = const AuthState.unauthenticated();
  }

  /// Re-run the session check (splash error retry).
  Future<void> retry() => _bootstrap();

  /// Send OTP. Throws [AuthException] on failure; UI handles loading/error.
  Future<void> sendOtp(String phone) => _repo.sendOtp(phone);

  /// Verify OTP. On success advances state (-> setup or main).
  /// Throws [AuthException] on failure; UI handles loading/error.
  Future<void> verifyOtp(String phone, String code) async {
    final user = await _repo.verifyOtp(phone, code);
    state = _resolve(user);
  }

  /// Persist first-time profile and enter the main app.
  Future<void> completeProfile({
    required String firstName,
    required String lastName,
    String? avatarUrl,
    UserRole role = UserRole.passenger,
    AppLanguage language = AppLanguage.az,
  }) async {
    final user = await _repo.updateProfile(
      firstName: firstName,
      lastName: lastName,
      avatarUrl: avatarUrl,
      role: role,
      language: language,
    );
    state = _resolve(user);
  }

  /// Clear session and return to login.
  Future<void> logout() async {
    await _repo.logout();
    state = const AuthState.unauthenticated();
  }

  /// Submit driver document verification.
  Future<void> submitVerification(String documentPath) async {
    final user = await _repo.submitVerification(documentPath);
    state = _resolve(user);
  }

  /// Instantly approve driver for testing (Mock repository only).
  Future<void> mockApproveDriver() async {
    final user = await _repo.mockApproveDriver();
    state = _resolve(user);
  }
}
